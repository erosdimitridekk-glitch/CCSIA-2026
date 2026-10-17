/* ================================= */
/* ELEMENTOS */
/* ================================= */

const chatContent =
    document.getElementById("chatContent");

const messageInput =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const newChatButton =
    document.getElementById("newChatButton");

const themeButton =
    document.getElementById("themeButton");

const menuButton =
    document.getElementById("menuButton");

const closeMenuButton =
    document.getElementById("closeMenuButton");

const menuOverlay =
    document.getElementById("menuOverlay");

const sidebar =
    document.getElementById("sidebar");

const historyList =
    document.getElementById("historyList");


/* ================================= */
/* CONFIGURAÇÃO DO HISTÓRICO */
/* ================================= */

const HISTORY_KEY =
    "ccsia-conversations";

const CURRENT_KEY =
    "ccsia-current-conversation";

let activeController = null;
let generationToken = 0;
let isGenerating = false;
let lastUserQuestion = "";

// Mantém a rolagem manual do usuário; só acompanha automaticamente se ele estiver no fim.
function isNearChatBottom() {
    if (!chatContent) return true;
    return chatContent.scrollHeight - chatContent.scrollTop - chatContent.clientHeight < 100;
}


let currentConversationId = null;
try {
    currentConversationId = localStorage.getItem(CURRENT_KEY);
} catch (error) {
    console.warn("O armazenamento local não está disponível neste navegador.", error);
}


/* ================================= */
/* GERAR ID */
/* ================================= */

function generateId() {

    return (
        Date.now().toString() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );

}


/* ================================= */
/* PEGAR HISTÓRICO */
/* ================================= */

function getConversations() {

    try {

        const saved =
            localStorage.getItem(
                HISTORY_KEY
            );


        if (!saved) {
            return [];
        }


        return JSON.parse(saved);

    } catch (error) {

        console.error(
            "Erro ao carregar histórico:",
            error
        );

        return [];

    }

}


/* ================================= */
/* SALVAR HISTÓRICO */
/* ================================= */

function saveConversations(
    conversations
) {

    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(
            conversations
        )
    );

}


/* ================================= */
/* CRIAR TÍTULO */
/* ================================= */

function createConversationTitle(
    text
) {

    let title =
        text
            .replace(/\s+/g, " ")
            .trim();


    if (title.length > 35) {

        title =
            title.substring(
                0,
                35
            ).trim();

        title += "...";

    }


    return title;

}


/* ================================= */
/* CRIAR CONVERSA */
/* ================================= */

function createConversation(
    firstMessage
) {

    const conversation = {

        id:
            generateId(),

        title:
            createConversationTitle(
                firstMessage
            ),

        messages: [],

        createdAt:
            Date.now(),

        updatedAt:
            Date.now()

    };


    const conversations =
        getConversations();


    conversations.unshift(
        conversation
    );


    saveConversations(
        conversations
    );


    currentConversationId =
        conversation.id;


    localStorage.setItem(
        CURRENT_KEY,
        currentConversationId
    );


    renderHistory();


    return conversation;

}


/* ================================= */
/* PEGAR CONVERSA ATUAL */
/* ================================= */

function getCurrentConversation() {

    if (!currentConversationId) {
        return null;
    }


    const conversations =
        getConversations();


    return conversations.find(
        conversation =>
            conversation.id ===
            currentConversationId
    ) || null;

}


/* ================================= */
/* SALVAR MENSAGEM */
/* ================================= */

function saveMessage(
    role,
    content
) {

    let conversation =
        getCurrentConversation();


    if (!conversation) {

        if (role === "user") {

            conversation =
                createConversation(
                    content
                );

        } else {

            return;

        }

    }


    conversation.messages.push({

        role:
            role,

        content:
            content,

        timestamp:
            Date.now()

    });


    conversation.updatedAt =
        Date.now();


    const conversations =
        getConversations();


    const index =
        conversations.findIndex(
            item =>
                item.id ===
                conversation.id
        );


    if (index !== -1) {

        conversations[index] =
            conversation;

    }


    saveConversations(
        conversations
    );


    renderHistory();

}


/* ================================= */
/* CARREGAR CONVERSA */
/* ================================= */

function loadConversation(
    conversationId
) {

    const conversations =
        getConversations();


    const conversation =
        conversations.find(
            item =>
                item.id ===
                conversationId
        );


    if (!conversation) {
        return;
    }


    currentConversationId =
        conversation.id;


    localStorage.setItem(
        CURRENT_KEY,
        currentConversationId
    );


    chatContent.innerHTML = "";


    conversation.messages.forEach(
        message => {

            addMessage(
                message.content,
                message.role === "ai"
                    ? "ai"
                    : "user"
            );

        }
    );


    if (
        conversation.messages.length === 0
    ) {

        showWelcome();

    }


    renderHistory();

    closeMobileMenu();

}


/* ================================= */
/* EXCLUIR CONVERSA */
/* ================================= */

function deleteConversation(
    conversationId
) {

    const conversations =
        getConversations();


    const filtered =
        conversations.filter(
            conversation =>
                conversation.id !==
                conversationId
        );


    saveConversations(
        filtered
    );


    if (
        currentConversationId ===
        conversationId
    ) {

        currentConversationId =
            null;


        localStorage.removeItem(
            CURRENT_KEY
        );


        showWelcome();

    }


    renderHistory();

}


/* ================================= */
/* RENDERIZAR HISTÓRICO */
/* ================================= */

function renderHistory() {

    if (!historyList) {
        return;
    }


    const conversations =
        getConversations();


    historyList.innerHTML = "";


    if (
        conversations.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.classList.add(
            "history-empty"
        );


        empty.textContent =
            "Nenhuma conversa ainda.";


        historyList.appendChild(
            empty
        );


        return;

    }


    conversations.forEach(
        conversation => {

            const item =
                document.createElement(
                    "div"
                );


            item.classList.add(
                "history-item"
            );


            if (
                conversation.id ===
                currentConversationId
            ) {

                item.classList.add(
                    "active"
                );

            }


            const icon =
                document.createElement(
                    "span"
                );


            icon.classList.add(
                "history-icon"
            );


            icon.textContent =
                "💬";


            const name =
                document.createElement(
                    "span"
                );


            name.classList.add(
                "history-name"
            );


            name.textContent =
                conversation.title;


            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.classList.add(
                "history-delete"
            );


            deleteButton.type =
                "button";


            deleteButton.textContent =
                "🗑️";


            deleteButton.title =
                "Excluir conversa";


            deleteButton.addEventListener(
                "click",
                function(event) {

                    event.stopPropagation();


                    const confirmed =
                        confirm(
                            "Excluir esta conversa?"
                        );


                    if (confirmed) {

                        deleteConversation(
                            conversation.id
                        );

                    }

                }
            );


            item.appendChild(
                icon
            );


            item.appendChild(
                name
            );


            item.appendChild(
                deleteButton
            );


            item.addEventListener(
                "click",
                function() {

                    loadConversation(
                        conversation.id
                    );

                }
            );


            historyList.appendChild(
                item
            );

        }
    );

}


/* ================================= */
/* WELCOME */
/* ================================= */

function showWelcome() {

    chatContent.innerHTML = `

        <div
            class="welcome"
            id="welcome"
        >

            <div class="welcome-icon">

                <img
                    src="logo.png"
                    alt="Logo da CCSIA"
                >

            </div>


            <h2>
                Olá! Eu sou a CCSIA.
            </h2>


            <p>
                A Inteligência Artificial da
                <strong>
                    Caixinha do Saber
                </strong>.
            </p>


            <span class="welcome-description">

                Faça uma pergunta e comece a aprender.

            </span>


            <div class="suggestions">


                <button
                    class="suggestion"
                    data-question="Explique a matemática de uma forma simples."
                >

                    <span>
                        📐
                    </span>

                    <div>

                        <strong>
                            Matemática
                        </strong>

                        <small>
                            Aprenda um conceito
                        </small>

                    </div>

                </button>


                <button
                    class="suggestion"
                    data-question="Explique o que foi a Revolução Industrial."
                >

                    <span>
                        🌎
                    </span>

                    <div>

                        <strong>
                            História
                        </strong>

                        <small>
                            Conheça acontecimentos
                        </small>

                    </div>

                </button>


                <button
                    class="suggestion"
                    data-question="Explique como funciona a programação para iniciantes."
                >

                    <span>
                        💻
                    </span>

                    <div>

                        <strong>
                            Tecnologia
                        </strong>

                        <small>
                            Descubra como funciona
                        </small>

                    </div>

                </button>


                <button
                    class="suggestion"
                    data-question="Explique o que é inteligência artificial."
                >

                    <span>
                        🤖
                    </span>

                    <div>

                        <strong>
                            Inteligência Artificial
                        </strong>

                        <small>
                            Entenda a tecnologia
                        </small>

                    </div>

                </button>


            </div>

        </div>

    `;

}


/* ================================= */
/* FORMATAÇÃO DA IA */
/* ================================= */

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatInlineMarkdown(value) {
    let safe = escapeHTML(value);
    safe = safe.replace(/`([^`]+)`/g, "<code>$1</code>");
    safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    safe = safe.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");
    return safe;
}

function formatAIResponse(text) {
    const lines = String(text || "").replace(/\r/g, "").split("\n");
    const output = [];
    let paragraph = [];
    let listType = null;
    let listItems = [];

    function flushParagraph() {
        if (paragraph.length) {
            output.push("<p>" + paragraph.map(formatInlineMarkdown).join("<br>") + "</p>");
            paragraph = [];
        }
    }
    function flushList() {
        if (listItems.length) {
            output.push("<" + listType + ">" + listItems.map(item => "<li>" + formatInlineMarkdown(item) + "</li>").join("") + "</" + listType + ">");
            listItems = [];
            listType = null;
        }
    }
    function parseCells(line) {
        return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(cell => cell.trim());
    }
    function isTableDivider(line) {
        const cells = parseCells(line);
        return cells.length > 0 && cells.every(cell => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")));
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const next = lines[i + 1] || "";
        if (line.includes("|") && next.includes("|") && isTableDivider(next)) {
            flushParagraph(); flushList();
            const headers = parseCells(line);
            i += 1;
            const rows = [];
            while (i + 1 < lines.length && lines[i + 1].includes("|") && lines[i + 1].trim() !== "") {
                i += 1;
                const cells = parseCells(lines[i]);
                if (isTableDivider(lines[i])) continue;
                rows.push(cells);
            }
            const head = "<thead><tr>" + headers.map(c => "<th>" + formatInlineMarkdown(c) + "</th>").join("") + "</tr></thead>";
            const body = "<tbody>" + rows.map(row => "<tr>" + headers.map((_, index) => "<td>" + formatInlineMarkdown(row[index] || "") + "</td>").join("") + "</tr>").join("") + "</tbody>";
            output.push('<div class="table-wrap"><table>' + head + body + '</table></div>');
            continue;
        }
        if (!line.trim()) { flushParagraph(); flushList(); continue; }
        const heading = line.match(/^(#{1,3})\s+(.+)$/);
        if (heading) {
            flushParagraph(); flushList();
            const level = heading[1].length;
            output.push("<h" + level + ">" + formatInlineMarkdown(heading[2]) + "</h" + level + ">");
            continue;
        }
        const bullet = line.match(/^\s*[-*•]\s+(.+)$/);
        const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/);
        if (bullet || numbered) {
            flushParagraph();
            const nextType = numbered ? "ol" : "ul";
            if (listType && listType !== nextType) flushList();
            listType = nextType;
            listItems.push((bullet || numbered)[1]);
            continue;
        }
        flushList();
        paragraph.push(line);
    }
    flushParagraph(); flushList();
    return output.join("");
}/* ================================= */
/* AVATAR */
/* ================================= */

function createAvatar(type) {

    const avatar =
        document.createElement(
            "div"
        );


    avatar.classList.add(
        "message-avatar",
        type === "ai"
            ? "ai-avatar"
            : "user-avatar"
    );


    if (type === "ai") {

        const logo =
            document.createElement(
                "img"
            );


        logo.src =
            "logo.png";


        logo.alt =
            "Logo da CCSIA";


        avatar.appendChild(
            logo
        );

    } else {

        avatar.textContent =
            "👤";

    }


    return avatar;

}


/* ================================= */
/* COPIAR */
/* ================================= */

function createCopyButton(text) {

    const copyButton =
        document.createElement(
            "button"
        );


    copyButton.classList.add(
        "copy-button"
    );


    copyButton.type =
        "button";


    copyButton.innerHTML =
        "📋 Copiar";


    copyButton.addEventListener(
        "click",
        async function() {

            try {

                await navigator.clipboard
                    .writeText(text);


                copyButton.innerHTML =
                    "✓ Copiado!";


                copyButton.classList.add(
                    "copied"
                );


                setTimeout(
                    function() {

                        copyButton.innerHTML =
                            "📋 Copiar";

                        copyButton.classList.remove(
                            "copied"
                        );

                    },
                    2000
                );


            } catch (error) {

                console.error(
                    "Erro ao copiar:",
                    error
                );

                copyButton.innerHTML =
                    "❌ Erro";


                setTimeout(
                    function() {

                        copyButton.innerHTML =
                            "📋 Copiar";

                    },
                    2000
                );

            }

        }
    );


    return copyButton;

}


/* ================================= */
/* ADICIONAR MENSAGEM */
/* ================================= */

function addMessage(
    text,
    type,
    save = false
) {

    const message =
        document.createElement(
            "div"
        );


    message.classList.add(
        "message",
        type
    );


    const avatar =
        createAvatar(type);


    const content =
        document.createElement(
            "div"
        );


    content.classList.add(
        "message-content"
    );


    const name =
        document.createElement(
            "div"
        );


    name.classList.add(
        "message-name"
    );


    name.textContent =
        type === "ai"
            ? "CCSIA"
            : "Você";


    const textElement =
        document.createElement(
            "div"
        );


    textElement.classList.add(
        "message-text"
    );


    if (type === "ai") {

        textElement.innerHTML =
            formatAIResponse(
                text
            );

    } else {

        textElement.textContent =
            text;

    }


    content.appendChild(
        name
    );


    content.appendChild(
        textElement
    );


    if (type === "ai") {

        content.appendChild(
            createCopyButton(
                text
            )
        );

    }


    message.appendChild(
        avatar
    );


    message.appendChild(
        content
    );


    chatContent.appendChild(
        message
    );


    chatContent.scrollTop =
        chatContent.scrollHeight;


    if (save) {

        saveMessage(
            type === "ai"
                ? "ai"
                : "user",
            text
        );

    }


    return message;

}


/* ================================= */
/* DIGITAÇÃO DA IA */
/* ================================= */

async function addTypingMessage(
    text,
    type
) {
    const myToken = generationToken;

    const message =
        document.createElement(
            "div"
        );


    message.classList.add(
        "message",
        type
    );


    const avatar =
        createAvatar(type);


    const content =
        document.createElement(
            "div"
        );


    content.classList.add(
        "message-content"
    );


    const name =
        document.createElement(
            "div"
        );


    name.classList.add(
        "message-name"
    );


    name.textContent =
        "CCSIA";


    const textElement =
        document.createElement(
            "div"
        );


    textElement.classList.add(
        "message-text"
    );


    content.appendChild(
        name
    );


    content.appendChild(
        textElement
    );


    message.appendChild(
        avatar
    );


    message.appendChild(
        content
    );


    chatContent.appendChild(
        message
    );


    let currentText =
        "";


    const speed =
        12;


    for (
        let i = 0;
        i < text.length;
        i++
    ) {
        if (myToken !== generationToken) {
            message.remove();
            return null;
        }

        currentText +=
            text[i];


        // Só acompanha a resposta automaticamente se o usuário já estiver
        // perto do final da conversa. Se ele rolar para cima, respeita a posição.
        const distanceFromBottom =
            chatContent.scrollHeight -
            chatContent.scrollTop -
            chatContent.clientHeight;
        const shouldFollowResponse = distanceFromBottom < 100;

        textElement.innerHTML =
            formatAIResponse(
                currentText
            );

        if (shouldFollowResponse) {
            chatContent.scrollTop =
                chatContent.scrollHeight;
        }

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    speed
                )
        );

    }


    const shouldFollowAfterTyping = isNearChatBottom();
    const actions = document.createElement("div");
    actions.className = "message-actions";
    actions.appendChild(createCopyButton(text));
    const regenerateButton = document.createElement("button");
    regenerateButton.className = "regenerate-button";
    regenerateButton.type = "button";
    regenerateButton.textContent = "↻ Regenerar resposta";
    regenerateButton.addEventListener("click", () => {
        if (lastUserQuestion) regenerateLastAnswer();
    });
    actions.appendChild(regenerateButton);
    content.appendChild(actions);

    saveMessage(
        "ai",
        text
    );


    if (shouldFollowAfterTyping) {
        chatContent.scrollTop = chatContent.scrollHeight;
    }

    return message;

}


/* ================================= */
/* LOADING */
/* ================================= */

function addLoadingMessage() {

    const message =
        document.createElement(
            "div"
        );


    message.classList.add(
        "message",
        "ai"
    );


    const avatar =
        createAvatar(
            "ai"
        );


    const content =
        document.createElement(
            "div"
        );


    content.classList.add(
        "message-content"
    );


    const name =
        document.createElement(
            "div"
        );


    name.classList.add(
        "message-name"
    );


    name.textContent =
        "CCSIA";


    const text =
        document.createElement(
            "div"
        );


    text.classList.add(
        "message-text"
    );


    const typing =
        document.createElement(
            "div"
        );


    typing.classList.add(
        "typing"
    );


    for (
        let i = 0;
        i < 3;
        i++
    ) {

        const dot =
            document.createElement(
                "span"
            );


        typing.appendChild(
            dot
        );

    }


    text.appendChild(
        typing
    );


    content.appendChild(
        name
    );


    content.appendChild(
        text
    );


    message.appendChild(
        avatar
    );


    message.appendChild(
        content
    );


    const shouldFollow = isNearChatBottom();
    chatContent.appendChild(message);
    if (shouldFollow) chatContent.scrollTop = chatContent.scrollHeight;

    return message;

}


/* ================================= */
/* ENVIAR */
/* ================================= */

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
    if (activeController) activeController.abort();
    activeController = null;
    isGenerating = false;
    updateSendButton();
    const loading = document.querySelector(".message.ai .typing")?.closest(".message");
    if (loading) loading.remove();
}

async function regenerateLastAnswer() {
    if (!lastUserQuestion || isGenerating) return;
    messageInput.value = lastUserQuestion;
    await sendMessage(true);
}

async function sendMessage(isRegeneration = false) {
    if (isGenerating) {
        stopGeneration();
        return;
    }

    const message = isRegeneration ? lastUserQuestion : messageInput.value.trim();
    if (!message) return;
    lastUserQuestion = message;

    const existingWelcome = document.getElementById("welcome");
    if (existingWelcome) existingWelcome.remove();

    if (!isRegeneration) {
        addMessage(message, "user", true);
        messageInput.value = "";
        resetTextarea();
    }

    isGenerating = true;
    generationToken++;
    const thisToken = generationToken;
    activeController = new AbortController();
    updateSendButton();
    const loadingMessage = addLoadingMessage();

    try {
        const currentConversation = getCurrentConversation();
        const savedMessages = (currentConversation?.messages || [])
            .filter(item => item && (item.role === "user" || item.role === "ai" || item.role === "assistant") && typeof item.content === "string");
        // A pergunta atual já foi salva no histórico visual; não a envie duas vezes.
        if (savedMessages.length && savedMessages[savedMessages.length - 1].role === "user" && savedMessages[savedMessages.length - 1].content === message) {
            savedMessages.pop();
        }
        const history = savedMessages.slice(-20).map(item => ({
            role: item.role === "ai" ? "assistant" : item.role,
            content: item.content.slice(0, 6000)
        }));

        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, history }),
            signal: activeController.signal
        });
        let data;
        try {
            data = await response.json();
        } catch (_) {
            throw new Error("O servidor retornou uma resposta inválida.");
        }
        if (thisToken !== generationToken) return;
        loadingMessage.remove();

        if (!response.ok) {
            addMessage(data.error || "Desculpe, ocorreu um erro ao falar com a CCSIA.", "ai");
            console.error("Erro da CCSIA:", data);
            return;
        }

        await addTypingMessage(data.answer, "ai");
    } catch (error) {
        if (error.name === "AbortError" || thisToken !== generationToken) return;
        console.error("Erro ao conectar à CCSIA:", error);
        if (loadingMessage.isConnected) loadingMessage.remove();
        await addTypingMessage("Não consegui concluir a solicitação à CCSIA. Verifique se o Worker está publicado e se a rota /api/chat está funcionando. Detalhe: " + (error.message || "erro de conexão"), "ai");
    } finally {
        if (thisToken === generationToken) {
            isGenerating = false;
            activeController = null;
            updateSendButton();
        }
    }
}

/* ================================= */
/* TEXTAREA */
/* ================================= */

messageInput.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


sendButton.addEventListener("click", () => {
    if (isGenerating) stopGeneration();
    else sendMessage();
});


messageInput.addEventListener(
    "input",
    function() {

        this.style.height =
            "auto";


        this.style.height =
            Math.min(
                this.scrollHeight,
                120
            ) + "px";

    }
);


function resetTextarea() {

    messageInput.style.height =
        "auto";

}


/* ================================= */
/* SUGESTÕES */
/* ================================= */

document.addEventListener(
    "click",
    function(event) {

        const suggestion =
            event.target.closest(
                ".suggestion"
            );


        if (!suggestion) {
            return;
        }


        const question =
            suggestion.dataset.question;


        messageInput.value =
            question;


        messageInput.focus();


        messageInput.dispatchEvent(
            new Event("input")
        );

    }
);


/* ================================= */
/* NOVA CONVERSA */
/* ================================= */

newChatButton.addEventListener(
    "click",
    function() {

        currentConversationId =
            null;


        localStorage.removeItem(
            CURRENT_KEY
        );


        showWelcome();


        renderHistory();


        closeMobileMenu();


        messageInput.value =
            "";


        resetTextarea();


        messageInput.focus();

    }
);


/* ================================= */
/* MENU MOBILE */
/* ================================= */

function openMobileMenu() {

    sidebar.classList.add(
        "mobile-open"
    );


    menuOverlay.classList.add(
        "active"
    );

}


function closeMobileMenu() {

    sidebar.classList.remove(
        "mobile-open"
    );


    menuOverlay.classList.remove(
        "active"
    );

}


menuButton.addEventListener(
    "click",
    openMobileMenu
);


closeMenuButton.addEventListener(
    "click",
    closeMobileMenu
);


menuOverlay.addEventListener(
    "click",
    closeMobileMenu
);


/* ================================= */
/* MODO ESCURO */
/* ================================= */

function updateThemeButton() {

    const darkMode =
        document.body.classList
            .contains("dark-mode");


    if (darkMode) {

        themeButton.textContent =
            "☀️";


        themeButton.title =
            "Modo claro";


        themeButton.setAttribute(
            "aria-label",
            "Ativar modo claro"
        );

    } else {

        themeButton.textContent =
            "🌙";


        themeButton.title =
            "Modo escuro";


        themeButton.setAttribute(
            "aria-label",
            "Ativar modo escuro"
        );

    }

}


themeButton.addEventListener(
    "click",
    function() {

        document.body.classList.toggle(
            "dark-mode"
        );


        const darkMode =
            document.body.classList
                .contains("dark-mode");


        localStorage.setItem(
            "ccsia-theme",
            darkMode
                ? "dark"
                : "light"
        );


        updateThemeButton();

    }
);


/* CARREGAR TEMA */

const savedTheme =
    localStorage.getItem(
        "ccsia-theme"
    );


if (
    savedTheme === "dark"
) {

    document.body.classList.add(
        "dark-mode"
    );

}


updateThemeButton();


/* ================================= */
/* CTRL + SHIFT + D */
/* ================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.ctrlKey &&
            event.shiftKey &&
            event.key.toLowerCase() === "d"
        ) {

            themeButton.click();

        }

    }
);


/* ================================= */
/* CARREGAR CONVERSA AO ABRIR SITE */
/* ================================= */

function loadSavedConversation() {

    if (!currentConversationId) {

        renderHistory();

        return;

    }


    const conversation =
        getCurrentConversation();


    if (!conversation) {

        currentConversationId =
            null;


        localStorage.removeItem(
            CURRENT_KEY
        );


        renderHistory();

        return;

    }


    chatContent.innerHTML =
        "";


    conversation.messages.forEach(
        message => {

            addMessage(
                message.content,
                message.role === "ai"
                    ? "ai"
                    : "user"
            );

        }
    );


    renderHistory();

}


/* ================================= */
/* INICIALIZAÇÃO */
/* ================================= */

loadSavedConversation();
