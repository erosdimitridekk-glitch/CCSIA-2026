/* ==========================================
   CCSIA — SCRIPT PRINCIPAL
   Histórico, contexto, tabelas, scroll,
   parar resposta, regenerar e temas.
   ========================================== */

const chatContent = document.getElementById("chatContent");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const newChatButton = document.getElementById("newChatButton");
const themeButton = document.getElementById("themeButton");
const menuButton = document.getElementById("menuButton");
const closeMenuButton = document.getElementById("closeMenuButton");
const menuOverlay = document.getElementById("menuOverlay");
const sidebar = document.getElementById("sidebar");
const historyList = document.getElementById("historyList");

const HISTORY_KEY = "ccsia-conversations";
const CURRENT_KEY = "ccsia-current-conversation";

let currentConversationId = localStorage.getItem(CURRENT_KEY);
let activeController = null;
let generationToken = 0;
let isGenerating = false;
let lastUserQuestion = "";

/* ==========================================
   UTILITÁRIOS
   ========================================== */

function generateId() {
    return Date.now() + "-" + Math.random().toString(36).slice(2, 9);
}

function getConversations() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch (error) {
        console.error("Erro ao carregar conversas:", error);
        return [];
    }
}

function saveConversations(conversations) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(conversations));
}

function getCurrentConversation() {
    return getConversations().find(
        conversation => conversation.id === currentConversationId
    ) || null;
}

function createConversationTitle(text) {
    const normalized = text.replace(/\s+/g, " ").trim();
    return normalized.length > 35
        ? normalized.slice(0, 35) + "..."
        : normalized;
}

function createConversation(firstMessage) {
    const conversation = {
        id: generateId(),
        title: createConversationTitle(firstMessage),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    const conversations = getConversations();
    conversations.unshift(conversation);
    saveConversations(conversations);

    currentConversationId = conversation.id;
    localStorage.setItem(CURRENT_KEY, currentConversationId);

    renderHistory();
    return conversation;
}

/* ==========================================
   SALVAR E RECUPERAR MENSAGENS
   ========================================== */

function saveMessage(role, content) {
    let conversation = getCurrentConversation();

    if (!conversation) {
        if (role !== "user") return;
        conversation = createConversation(content);
    }

    conversation.messages.push({
        role,
        content,
        timestamp: Date.now()
    });

    conversation.updatedAt = Date.now();

    const conversations = getConversations();
    const index = conversations.findIndex(
        item => item.id === conversation.id
    );

    if (index !== -1) {
        conversations[index] = conversation;
    }

    saveConversations(conversations);
    renderHistory();
}

/*
 * Monta o contexto anterior para enviar à Groq.
 * O Worker precisa ler body.history para utilizá-lo.
 */
function getConversationContext() {
    const conversation = getCurrentConversation();

    if (!conversation) return [];

    return conversation.messages
        .filter(item =>
            item &&
            typeof item.content === "string" &&
            (item.role === "user" || item.role === "ai")
        )
        .slice(-20)
        .map(item => ({
            role: item.role === "ai" ? "assistant" : "user",
            content: item.content
        }));
}

/* ==========================================
   HISTÓRICO LATERAL
   ========================================== */

function renderHistory() {
    if (!historyList) return;

    historyList.innerHTML = "";
    const conversations = getConversations();

    if (conversations.length === 0) {
        const empty = document.createElement("div");
        empty.className = "history-empty";
        empty.textContent = "Nenhuma conversa ainda.";
        historyList.appendChild(empty);
        return;
    }

    conversations.forEach(conversation => {
        const item = document.createElement("div");
        item.className = "history-item";

        if (conversation.id === currentConversationId) {
            item.classList.add("active");
        }

        const icon = document.createElement("span");
        icon.className = "history-icon";
        icon.textContent = "💬";

        const name = document.createElement("span");
        name.className = "history-name";
        name.textContent = conversation.title;

        const deleteButton = document.createElement("button");
        deleteButton.className = "history-delete";
        deleteButton.type = "button";
        deleteButton.textContent = "🗑️";
        deleteButton.title = "Excluir conversa";

        deleteButton.addEventListener("click", event => {
            event.stopPropagation();

            if (confirm("Excluir esta conversa?")) {
                deleteConversation(conversation.id);
            }
        });

        item.append(icon, name, deleteButton);

        item.addEventListener("click", () => {
            loadConversation(conversation.id);
        });

        historyList.appendChild(item);
    });
}

function loadConversation(conversationId) {
    const conversation = getConversations().find(
        item => item.id === conversationId
    );

    if (!conversation) return;

    if (isGenerating) stopGeneration();

    currentConversationId = conversation.id;
    localStorage.setItem(CURRENT_KEY, currentConversationId);

    chatContent.innerHTML = "";

    conversation.messages.forEach(message => {
        addMessage(
            message.content,
            message.role === "ai" ? "ai" : "user"
        );
    });

    if (conversation.messages.length === 0) {
        showWelcome();
    }

    renderHistory();
    closeMobileMenu();
}

function deleteConversation(conversationId) {
    const conversations = getConversations().filter(
        item => item.id !== conversationId
    );

    saveConversations(conversations);

    if (currentConversationId === conversationId) {
        currentConversationId = null;
        localStorage.removeItem(CURRENT_KEY);
        chatContent.innerHTML = "";
        showWelcome();
    }

    renderHistory();
}

/* ==========================================
   MENSAGEM DE BOAS-VINDAS
   ========================================== */

function showWelcome() {
    chatContent.innerHTML = `
        <div class="welcome" id="welcome">
            <div class="welcome-icon">
                <img src="logo.png" alt="Logo da CCSIA">
            </div>
            <h2>Olá! Eu sou a CCSIA 🤖</h2>
            <p>Sua Caixinha do Saber Inteligência Artificial.</p>
            <p>O que vamos aprender hoje?</p>
        </div>
    `;
}

/* ==========================================
   FORMATAÇÃO SEGURA DE TEXTO
   ========================================== */

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatInlineMarkdown(text) {
    let result = escapeHTML(text);

    result = result.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
    );

    result = result.replace(
        /\*\*(.+?)\*\*/g,
        "<strong>$1</strong>"
    );

    result = result.replace(
        /(^|[^*])\*([^*\n]+)\*/g,
        "$1<em>$2</em>"
    );

    return result;
}

function formatAIResponse(text) {
    const lines = String(text).split("\n");
    const output = [];
    let paragraph = [];
    let listType = null;
    let listItems = [];
    let codeLines = [];
    let inCode = false;
    let tableLines = [];

    function flushParagraph() {
        if (!paragraph.length) return;

        output.push(
            `<p>${paragraph.map(formatInlineMarkdown).join("<br>")}</p>`
        );

        paragraph = [];
    }

    function flushList() {
        if (!listItems.length) return;

        const tag = listType === "ol" ? "ol" : "ul";

        output.push(
            `<${tag}>${listItems.map(item =>
                `<li>${formatInlineMarkdown(item)}</li>`
            ).join("")}</${tag}>`
        );

        listItems = [];
        listType = null;
    }

    function flushTable() {
        if (!tableLines.length) return;

        const rows = tableLines
            .filter(line => !/^\s*\|?[\s:|-]+\|?\s*$/.test(line))
            .map(line =>
                line.trim()
                    .replace(/^\|/, "")
                    .replace(/\|$/, "")
                    .split("|")
                    .map(cell => cell.trim())
            );

        if (rows.length) {
            const headers = rows[0];

            let html = "<div class='table-wrapper'><table><thead><tr>";

            html += headers.map(cell =>
                `<th>${formatInlineMarkdown(cell)}</th>`
            ).join("");

            html += "</tr></thead><tbody>";

            rows.slice(1).forEach(row => {
                html += "<tr>";

                headers.forEach((_, index) => {
                    html += `<td>${formatInlineMarkdown(row[index] || "")}</td>`;
                });

                html += "</tr>";
            });

            html += "</tbody></table></div>";
            output.push(html);
        }

        tableLines = [];
    }

    for (const line of lines) {
        if (line.trim().startsWith("```")) {
            flushParagraph();
            flushList();
            flushTable();

            if (inCode) {
                output.push(
                    `<pre><code>${escapeHTML(codeLines.join("\n"))}</code></pre>`
                );
                codeLines = [];
                inCode = false;
            } else {
                inCode = true;
            }

            continue;
        }

        if (inCode) {
            codeLines.push(line);
            continue;
        }

        if (line.includes("|") && line.trim().startsWith("|")) {
            flushParagraph();
            flushList();
            tableLines.push(line);
            continue;
        } else {
            flushTable();
        }

        const heading = line.match(/^(#{1,3})\s+(.+)$/);

        if (heading) {
            flushParagraph();
            flushList();

            const level = heading[1].length;
            output.push(
                `<h${level}>${formatInlineMarkdown(heading[2])}</h${level}>`
            );

            continue;
        }

        const unordered = line.match(/^\s*[-*•]\s+(.+)$/);
        const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);

        if (unordered || ordered) {
            flushParagraph();

            const nextType = ordered ? "ol" : "ul";

            if (listType && listType !== nextType) {
                flushList();
            }

            listType = nextType;
            listItems.push((unordered || ordered)[1]);
            continue;
        }

        if (!line.trim()) {
            flushParagraph();
            flushList();
            continue;
        }

        flushList();
        paragraph.push(line);
    }

    flushParagraph();
    flushList();
    flushTable();

    if (inCode) {
        output.push(
            `<pre><code>${escapeHTML(codeLines.join("\n"))}</code></pre>`
        );
    }

    return output.join("");
}

/* ==========================================
   AVATAR E BOTÃO DE COPIAR
   ========================================== */

function createAvatar(type) {
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";

    if (type === "ai") {
        const image = document.createElement("img");
        image.src = "logo.png";
        image.alt = "CCSIA";
        avatar.appendChild(image);
    } else {
        avatar.textContent = "👤";
    }

    return avatar;
}

function createCopyButton(text) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-button";
    button.textContent = "📋 Copiar";

    button.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(text);
            button.textContent = "✅ Copiado!";

            setTimeout(() => {
                button.textContent = "📋 Copiar";
            }, 1500);
        } catch (error) {
            console.error("Não foi possível copiar:", error);
            button.textContent = "Falha ao copiar";
        }
    });

    return button;
}

/* ==========================================
   CONTROLE DE ROLAGEM
   ========================================== */

function isNearBottom
