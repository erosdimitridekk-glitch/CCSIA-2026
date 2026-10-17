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

function isNearBottom() {
    return (
        chatContent.scrollHeight -
        chatContent.scrollTop -
        chatContent.clientHeight
    ) < 100;
}

/*
 * Acompanha o final somente se a pessoa já estiver
 * perto do final. Nunca força a rolagem quando ela
 * subiu para ler mensagens anteriores.
 */
function followBottomIfNeeded(shouldFollow) {
    if (shouldFollow) {
        chatContent.scrollTop = chatContent.scrollHeight;
    }
}

/* ==========================================
   ADICIONAR MENSAGEM
   ========================================== */

function addMessage(text, type, save = false) {
    const message = document.createElement("div");
    message.classList.add("message", type);

    const content = document.createElement("div");
    content.className = "message-content";

    const name = document.createElement("div");
    name.className = "message-name";
    name.textContent = type === "ai" ? "CCSIA" : "Você";

    const textElement = document.createElement("div");
    textElement.className = "message-text";

    if (type === "ai") {
        textElement.innerHTML = formatAIResponse(text);
    } else {
        textElement.textContent = text;
    }

    content.append(name, textElement);

    if (type === "ai") {
        content.appendChild(createCopyButton(text));
    }

    message.append(createAvatar(type), content);
    chatContent.appendChild(message);

    if (save) {
        saveMessage(type === "ai" ? "ai" : "user", text);
    }

    return message;
}

/* ==========================================
   RESPOSTA COM EFEITO DE DIGITAÇÃO
   ========================================== */

async function addTypingMessage(text, type, token) {
    const shouldFollow = isNearBottom();

    const message = document.createElement("div");
    message.classList.add("message", type);

    const content = document.createElement("div");
    content.className = "message-content";

    const name = document.createElement("div");
    name.className = "message-name";
    name.textContent = "CCSIA";

    const textElement = document.createElement("div");
    textElement.className = "message-text";

    content.append(name, textElement);
    message.append(createAvatar(type), content);
    chatContent.appendChild(message);

    let currentText = "";
    const speed = 12;

    for (let index = 0; index < text.length; index++) {
        if (token !== generationToken) {
            message.remove();
            return null;
        }

        currentText += text[index];
        textElement.innerHTML = formatAIResponse(currentText);

        /*
         * Recalcula se a pessoa ainda está perto do final.
         * Se ela rolou para cima, não a puxa de volta.
         */
        followBottomIfNeeded(shouldFollow && isNearBottom());

        await new Promise(resolve => setTimeout(resolve, speed));
    }

    const actions = document.createElement("div");
    actions.className = "message-actions";

    actions.appendChild(createCopyButton(text));

    const regenerateButton = document.createElement("button");
    regenerateButton.className = "regenerate-button";
    regenerateButton.type = "button";
    regenerateButton.textContent = "↻ Regenerar resposta";

    regenerateButton.addEventListener("click", () => {
        if (lastUserQuestion && !isGenerating) {
            regenerateLastAnswer();
        }
    });

    actions.appendChild(regenerateButton);
    content.appendChild(actions);

    saveMessage("ai", text);

    return message;
}

/* ==========================================
   INDICADOR DE CARREGAMENTO
   ========================================== */

function addLoadingMessage() {
    const message = document.createElement("div");
    message.className = "message ai";

    const content = document.createElement("div");
    content.className = "message-content";

    const name = document.createElement("div");
    name.className = "message-name";
    name.textContent = "CCSIA";

    const text = document.createElement("div");
    text.className = "message-text";

    const typing = document.createElement("div");
    typing.className = "typing";

    for (let i = 0; i < 3; i++) {
        typing.appendChild(document.createElement("span"));
    }

    text.appendChild(typing);
    content.append(name, text);
    message.append(createAvatar("ai"), content);
    chatContent.appendChild(message);

    return message;
}

/* ==========================================
   PARAR E REGENERAR
   ========================================== */

function updateSendButton() {
    if (isGenerating) {
        sendButton.textContent = "■";
        sendButton.classList.add("is-stopping");
        sendButton.setAttribute("aria-label", "Parar resposta");
        sendButton.title = "Parar resposta";
    } else {
        sendButton.textContent = "➤";
        sendButton.classList.remove("is-stopping");
        sendButton.setAttribute("aria-label", "Enviar pergunta");
        sendButton.title = "Enviar pergunta";
    }
}

function stopGeneration() {
    if (!isGenerating) return;

    generationToken++;

    if (activeController) {
        activeController.abort();
    }

    activeController = null;
    isGenerating = false;
    updateSendButton();

    document.querySelectorAll(".typing").forEach(element => {
        element.closest(".message")?.remove();
    });
}

async function regenerateLastAnswer() {
    if (!lastUserQuestion || isGenerating) return;

    const conversation = getCurrentConversation();

    if (conversation) {
        const messages = conversation.messages;

        if (messages.length && messages[messages.length - 1].role === "ai") {
            messages.pop();
            saveConversations(
                getConversations().map(item =>
                    item.id === conversation.id ? conversation : item
                )
            );
        }
    }

    await sendMessage(true);
}

/* ==========================================
   ENVIAR MENSAGEM COM CONTEXTO
   ========================================== */

async function sendMessage(isRegeneration = false) {
    if (isGenerating) {
        stopGeneration();
        return;
    }

    const message = isRegeneration
        ? lastUserQuestion
        : messageInput.value.trim();

    if (!message) return;

    lastUserQuestion = message;

    const welcome = document.getElementById("welcome");
    if (welcome) welcome.remove();

    if (!isRegeneration) {
        addMessage(message, "user", true);
        messageInput.value = "";
        resetTextarea();
    }

    /*
     * Captura as mensagens anteriores à pergunta atual.
     * Como a pergunta atual já foi salva, removemos a
     * última mensagem para não enviá-la duas vezes.
     */
    const context = getConversationContext();

    if (
        context.length &&
        context[context.length - 1].role === "user" &&
        context[context.length - 1].content === message
    ) {
        context.pop();
    }

    isGenerating = true;
    generationToken++;

    const thisToken = generationToken;
    activeController = new AbortController();

    updateSendButton();

    const loadingMessage = addLoadingMessage();

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message,
                history: context
            }),
            signal: activeController.signal
        });

        const data = await response.json();

        if (thisToken !== generationToken) return;

        loadingMessage.remove();

        if (!response.ok) {
            addMessage(
                data.error || "Desculpe, ocorreu um erro ao falar com a CCSIA.",
                "ai"
            );

            console.error("Erro da CCSIA:", data);
            return;
        }

        await addTypingMessage(data.answer, "ai", thisToken);

    } catch (error) {
        if (error.name === "AbortError" || thisToken !== generationToken) {
            return;
        }

        console.error("Erro ao conectar à CCSIA:", error);

        if (loadingMessage.isConnected) {
            loadingMessage.remove();
        }

        addMessage(
            "Não consegui conectar ao servidor da CCSIA. Verifique sua conexão e tente novamente.",
            "ai"
        );

    } finally {
        if (thisToken === generationToken) {
            isGenerating = false;
            activeController = null;
            updateSendButton();
        }
    }
}

/* ==========================================
   CAMPO DE TEXTO E ENVIO
   ========================================== */

messageInput.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

sendButton.addEventListener("click", () => {
    if (isGenerating) {
        stopGeneration();
    } else {
        sendMessage();
    }
});

messageInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 120) + "px";
});

function resetTextarea() {
    messageInput.style.height = "auto";
}

/* ==========================================
   SUGESTÕES DE PERGUNTAS
   ========================================== */

document.addEventListener("click", event => {
    const suggestion = event.target.closest(".suggestion");
    if (!suggestion) return;

    messageInput.value = suggestion.dataset.question || "";
    messageInput.focus();
    messageInput.dispatchEvent(new Event("input"));
});

/* ==========================================
   NOVA CONVERSA
   ========================================== */

newChatButton.addEventListener("click", () => {
    if (isGenerating) stopGeneration();

    currentConversationId = null;
    localStorage.removeItem(CURRENT_KEY);

    chatContent.innerHTML = "";
    showWelcome();
    renderHistory();
    closeMobileMenu();

    messageInput.value = "";
    resetTextarea();
    messageInput.focus();
});

/* ==========================================
   MENU MOBILE
   ========================================== */

function openMobileMenu() {
    sidebar?.classList.add("mobile-open");
    menuOverlay?.classList.add("active");
}

function closeMobileMenu() {
    sidebar?.classList.remove("mobile-open");
    menuOverlay?.classList.remove("active");
}

menuButton?.addEventListener("click", openMobileMenu);
closeMenuButton?.addEventListener("click", closeMobileMenu);
menuOverlay?.addEventListener("click", closeMobileMenu);

/* ==========================================
   TEMA CLARO E ESCURO
   ========================================== */

function updateThemeButton() {
    if (!themeButton) return;

    const darkMode = document.body.classList.contains("dark-mode");

    themeButton.textContent = darkMode ? "☀️" : "🌙";
    themeButton.title = darkMode ? "Modo claro" : "Modo escuro";
    themeButton.setAttribute(
        "aria-label",
        darkMode ? "Ativar modo claro" : "Ativar modo escuro"
    );
}

themeButton?.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    const darkMode = document.body.classList.contains("dark-mode");

    localStorage.setItem("ccsia-theme", darkMode ? "dark" : "light");
    updateThemeButton();
});

if (localStorage.getItem("ccsia-theme") === "dark") {
    document.body.classList.add("dark-mode");
}

updateThemeButton();

/* Atalho Ctrl + Shift + D para alternar o tema. */
document.addEventListener("keydown", event => {
    if (
        event.ctrlKey &&
        event.shiftKey &&
        event.key.toLowerCase() === "d"
    ) {
        themeButton?.click();
    }
});

/* ==========================================
   CARREGAR CONVERSA SALVA
   ========================================== */

function loadSavedConversation() {
    const conversation = getCurrentConversation();

    if (!conversation) {
        renderHistory();

        if (!document.getElementById("welcome")) {
            showWelcome();
        }

        return;
    }

    chatContent.innerHTML = "";

    conversation.messages.forEach(message => {
        addMessage(
            message.content,
            message.role === "ai" ? "ai" : "user"
        );
    });

    renderHistory();
}

/* ==========================================
   INICIALIZAÇÃO
   ========================================== */

loadSavedConversation();
