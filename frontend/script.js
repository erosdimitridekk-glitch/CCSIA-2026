/* ================================= */
/* ELEMENTOS */
/* ================================= */

const chatContent =
    document.getElementById("chatContent");

const messageInput =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const micButton =
    document.getElementById("micButton");
const cameraButton = document.getElementById("cameraButton");
const cameraModal = document.getElementById("cameraModal");
const cameraVideo = document.getElementById("cameraVideo");
const cameraCanvas = document.getElementById("cameraCanvas");
const cameraStatus = document.getElementById("cameraStatus");
const captureButton = document.getElementById("captureButton");
const cameraClose = document.getElementById("cameraClose");
let cameraStream = null;
let pendingImageData = null;

async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
        alert("A câmera precisa de uma conexão segura (HTTPS) e de um navegador compatível.");
        return;
    }
    cameraModal.hidden = false;
    cameraStatus.textContent = "Aguardando permissão para usar a câmera…";
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        cameraVideo.srcObject = cameraStream;
        cameraStatus.textContent = "Enquadre a imagem e toque em Tirar foto.";
    } catch (error) {
        cameraStatus.textContent = error.name === "NotAllowedError" ? "Permissão negada. Libere a câmera nas configurações do navegador." : "Não foi possível abrir a câmera neste dispositivo.";
    }
}

function closeCamera() {
    cameraStream?.getTracks().forEach(track => track.stop());
    cameraStream = null;
    cameraVideo.srcObject = null;
    cameraModal.hidden = true;
}

function captureCameraPhoto() {
    if (!cameraVideo.videoWidth) return;
    const scale = Math.min(1, 1280 / cameraVideo.videoWidth);
    cameraCanvas.width = Math.round(cameraVideo.videoWidth * scale);
    cameraCanvas.height = Math.round(cameraVideo.videoHeight * scale);
    cameraCanvas.getContext("2d").drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);
    pendingImageData = cameraCanvas.toDataURL("image/jpeg", 0.78);
    cameraButton.classList.add("has-photo");
    cameraButton.title = "Foto anexada. Toque para tirar outra.";
    if (!messageInput.value.trim()) messageInput.placeholder = "Pergunte algo sobre a foto…";
    closeCamera();
    messageInput.focus();
}

cameraButton?.addEventListener("click", openCamera);
cameraClose?.addEventListener("click", closeCamera);
captureButton?.addEventListener("click", captureCameraPhoto);
cameraModal?.addEventListener("click", event => { if (event.target === cameraModal) closeCamera(); });

const newChatButton =
    document.getElementById("newChatButton");

const themeButton =
    document.getElementById("themeButton");

const studyModeButton =
    document.getElementById("studyModeButton");

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
/* LOGO POR TEMA */
/* ================================= */

const LIGHT_LOGO =
    "logo.png";

const DARK_LOGO =
    "logo-dark.png";

function getCurrentLogo() {

    return document.body.classList.contains("dark-mode")
        ? DARK_LOGO
        : LIGHT_LOGO;

}

function updateLogos() {

    const logoSource = getCurrentLogo();

    document.querySelectorAll(
        "[data-logo-light][data-logo-dark]"
    ).forEach(function(logo) {

        logo.src = logoSource;

    });

}


/* ================================= */
/* CONFIGURAÇÃO DO HISTÓRICO */
/* ================================= */

const HISTORY_KEY =
    "ccsia-conversations";

const CURRENT_KEY =
    "ccsia-current-conversation";

const STUDY_MODE_KEY =
    "ccsia-study-mode";

function readStorage(key) {
    try { return localStorage.getItem(key); }
    catch (error) { console.error("Falha ao ler armazenamento local:", error); return null; }
}
function writeStorage(key, value) {
    try { localStorage.setItem(key, value); return true; }
    catch (error) { console.error("Falha ao gravar armazenamento local:", error); return false; }
}
function removeStorage(key) {
    try { localStorage.removeItem(key); return true; }
    catch (error) { console.error("Falha ao remover armazenamento local:", error); return false; }
}

let studyMode =
    readStorage(STUDY_MODE_KEY) === "true";

let typingStopRequested = false;


let currentConversationId =
    readStorage(CURRENT_KEY);


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
        const saved = localStorage.getItem(HISTORY_KEY);
        if (!saved) return [];

        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) {
            console.warn("Histórico inválido; exibindo lista vazia sem apagar os dados salvos.");
            return [];
        }

        // Ignora somente entradas inválidas para evitar que uma conversa malformada
        // impeça a barra lateral inteira de aparecer.
        return parsed.filter(item =>
            item && typeof item === "object" &&
            typeof item.id === "string" &&
            typeof item.title === "string" &&
            Array.isArray(item.messages)
        );
    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        return [];
    }
}


/* ================================= */
/* SALVAR HISTÓRICO */
/* ================================= */

function saveConversations(conversations) {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(conversations));
        return true;
    } catch (error) {
        console.error("Não foi possível salvar o histórico da CCSIA:", error);
        // Mantém a conversa atual funcionando mesmo se o navegador bloquear
        // o armazenamento ou estiver sem espaço.
        return false;
    }
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


    writeStorage(CURRENT_KEY, currentConversationId);


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


    writeStorage(CURRENT_KEY, currentConversationId);


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


        removeStorage(CURRENT_KEY);


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
                    data-logo-light="logo.png"
                    data-logo-dark="logo-dark.png"
                    alt="Logo da CCSIA"
                >

            </div>


            <h2>
                Olá! Eu sou o CCSIA.
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

function escapeHTML(text) {

    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ================================= */
/* MARKDOWN INLINE */
/* ================================= */

function formatInlineMarkdown(text) {

    let formatted =
        escapeHTML(text);


    formatted =
        formatted.replace(
            /\*\*(.+?)\*\*/g,
            "<strong>$1</strong>"
        );


    formatted =
        formatted.replace(
            /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
            "<em>$1</em>"
        );


    formatted =
        formatted.replace(
            /`([^`]+)`/g,
            "<code>$1</code>"
        );


    return formatted;

}


/* ================================= */
/* TABELAS MARKDOWN */
/* ================================= */

function isMarkdownTableSeparator(line) {

    const cells =
        line
            .trim()
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map(
                cell =>
                    cell.trim()
            );


    return (
        cells.length >= 2 &&
        cells.every(
            cell =>
                /^:?-{3,}:?$/.test(cell)
        )
    );

}


function splitMarkdownTableRow(line) {

    let row =
        line.trim();


    if (row.startsWith("|")) {
        row = row.substring(1);
    }


    if (row.endsWith("|")) {
        row = row.substring(
            0,
            row.length - 1
        );
    }


    return row
        .split(/(?<!\\)\|/)
        .map(
            cell =>
                cell
                    .replace(/\\\|/g, "|")
                    .trim()
        );

}


function renderMarkdownTable(lines) {

    if (
        lines.length < 2 ||
        !isMarkdownTableSeparator(lines[1])
    ) {
        return null;
    }


    const header =
        splitMarkdownTableRow(
            lines[0]
        );


    const separator =
        splitMarkdownTableRow(
            lines[1]
        );


    if (
        header.length < 2 ||
        separator.length !== header.length
    ) {
        return null;
    }


    const bodyRows =
        lines
            .slice(2)
            .map(splitMarkdownTableRow)
            .filter(
                row =>
                    row.length === header.length
            );


    const alignment =
        separator.map(
            cell => {

                const trimmed =
                    cell.trim();

                if (
                    trimmed.startsWith(":") &&
                    trimmed.endsWith(":")
                ) {
                    return "center";
                }

                if (
                    trimmed.endsWith(":")
                ) {
                    return "right";
                }

                return "left";

            }
        );


    let html =
        '<div class="markdown-table-wrapper">' +
        '<table class="markdown-table">' +
        "<thead><tr>";


    header.forEach(
        (cell, index) => {

            html +=
                `<th style="text-align:${alignment[index]}">` +
                formatInlineMarkdown(cell) +
                "</th>";

        }
    );


    html +=
        "</tr></thead>";


    if (bodyRows.length > 0) {

        html +=
            "<tbody>";


        bodyRows.forEach(
            row => {

                html +=
                    "<tr>";


                row.forEach(
                    (cell, index) => {

                        html +=
                            `<td style="text-align:${alignment[index]}">` +
                            formatInlineMarkdown(cell) +
                            "</td>";

                    }
                );


                html +=
                    "</tr>";

            }
        );


        html +=
            "</tbody>";

    }


    html +=
        "</table></div>";


    return html;

}


function extractMarkdownTables(text) {

    const lines =
        text.split("\n");

    const output = [];
    const placeholders = [];
    let index = 0;


    while (index < lines.length) {

        const current =
            lines[index];

        const next =
            lines[index + 1];


        if (
            next &&
            current.includes("|") &&
            isMarkdownTableSeparator(next)
        ) {

            const tableLines = [
                current,
                next
            ];

            let cursor =
                index + 2;


            while (
                cursor < lines.length
            ) {

                const line =
                    lines[cursor];

                if (
                    !line.includes("|") ||
                    !line.trim()
                ) {
                    break;
                }


                const cells =
                    splitMarkdownTableRow(line);


                if (
                    cells.length < 2
                ) {
                    break;
                }


                tableLines.push(line);
                cursor++;

            }


            const tableHTML =
                renderMarkdownTable(
                    tableLines
                );


            if (tableHTML) {

                const token =
                    `\u0000CCSIA_TABLE_${placeholders.length}\u0000`;

                placeholders.push(
                    tableHTML
                );


                output.push(token);


                index =
                    cursor;

                continue;

            }

        }


        output.push(current);
        index++;

    }


    return {
        text:
            output.join("\n"),
        placeholders
    };

}


/* ================================= */
/* FORMATAÇÃO DA IA */
/* ================================= */

function formatAIResponse(text) {

    const extracted =
        extractMarkdownTables(text);


    let formatted =
        escapeHTML(
            extracted.text
        );


    formatted =
        formatted.replace(
            /^### (.+)$/gm,
            "<h3>$1</h3>"
        );


    formatted =
        formatted.replace(
            /^## (.+)$/gm,
            "<h2>$1</h2>"
        );


    formatted =
        formatted.replace(
            /^# (.+)$/gm,
            "<h1>$1</h1>"
        );


    formatted =
        formatted.replace(
            /\*\*(.+?)\*\*/g,
            "<strong>$1</strong>"
        );


    formatted =
        formatted.replace(
            /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
            "<em>$1</em>"
        );


    formatted =
        formatted.replace(
            /`([^`]+)`/g,
            "<code>$1</code>"
        );


    formatted =
        formatted.replace(
            /^(💡|📌|⚠️|🎯)\s+<strong>([^<]+)<\/strong>\s*:?[ \t]*(.*)$/gm,
            '<div class="ai-callout ai-callout-$1"><span class="ai-callout-icon">$1</span><div><strong>$2</strong><br>$3</div></div>'
        );


    formatted =
        formatted.replace(
            /^[•\-] (.+)$/gm,
            "<li>$1</li>"
        );


    formatted =
        formatted.replace(
            /(<li>.*<\/li>\n?)+/g,
            function(match) {

                return (
                    "<ul>" +
                    match +
                    "</ul>"
                );

            }
        );


    formatted =
        formatted.replace(
            /\n/g,
            "<br>"
        );


    formatted =
        formatted.replace(
            /(<\/h[1-3]>)<br>/g,
            "$1"
        );


    formatted =
        formatted.replace(
            /<br><ul>/g,
            "<ul>"
        );


    formatted =
        formatted.replace(
            /<\/ul><br>/g,
            "</ul>"
        );


    extracted.placeholders.forEach(
        (tableHTML, index) => {

            const token =
                escapeHTML(
                    `\u0000CCSIA_TABLE_${index}\u0000`
                );


            formatted =
                formatted.replace(
                    token,
                    tableHTML
                );

        }
    );


    return formatted;

}


/* ================================= */
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
            getCurrentLogo();

        logo.setAttribute(
            "data-logo-light",
            LIGHT_LOGO
        );

        logo.setAttribute(
            "data-logo-dark",
            DARK_LOGO
        );


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

    const copyButton = document.createElement("button");
    copyButton.classList.add("copy-button");
    copyButton.type = "button";
    copyButton.innerHTML = "📋 Copiar";

    copyButton.addEventListener("click", async function() {
        try {
            await navigator.clipboard.writeText(text);
            copyButton.innerHTML = "✓ Copiado!";
            copyButton.classList.add("copied");
            setTimeout(function() {
                copyButton.innerHTML = "📋 Copiar";
                copyButton.classList.remove("copied");
            }, 2000);
        } catch (error) {
            console.error("Erro ao copiar:", error);
            copyButton.innerHTML = "❌ Erro";
            setTimeout(function() { copyButton.innerHTML = "📋 Copiar"; }, 2000);
        }
    });

    return copyButton;

}

function getPreviousUserQuestion(message) {
    const previous = message?.previousElementSibling;
    if (!previous || !previous.classList.contains("user")) return "";
    return previous.querySelector(".message-text")?.textContent?.trim() || "";
}

function createRegenerateButton(message) {
    const button = document.createElement("button");
    button.className = "regenerate-button";
    button.type = "button";
    button.innerHTML = "🔄 Regenerar";
    button.addEventListener("click", async function() {
        const question = getPreviousUserQuestion(message);
        const oldAnswer = message.querySelector(".message-text")?.textContent?.trim() || "";
        if (!question) return;
        button.disabled = true;
        button.innerHTML = "⏳ Gerando...";
        message.remove();
        await regenerateAnswer(question, oldAnswer);
    });
    return button;
}

function createStopButton(stopCallback) {
    const button = document.createElement("button");
    button.className = "stop-button";
    button.type = "button";
    button.innerHTML = "⏹ Parar";
    button.addEventListener("click", function() {
        stopCallback();
        button.disabled = true;
        button.innerHTML = "✓ Parado";
    });
    return button;
}

function createMessageActions(text, message, includeStop = false, stopCallback = null) {
    const actions = document.createElement("div");
    actions.className = "message-actions";
    actions.appendChild(createCopyButton(text));
    if (includeStop && stopCallback) {
        actions.appendChild(createStopButton(stopCallback));
    } else if (message) {
        actions.appendChild(createRegenerateButton(message));
    }
    return actions;
}


/* ================================= */
/* ADICIONAR MENSAGEM */
/* ================================= */

function addMessage(
    text,
    type,
    save = false,
    imageData = null
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

    if (type === "user" && imageData) {
        const photo = document.createElement("img");
        photo.className = "user-photo-attachment";
        photo.src = imageData;
        photo.alt = "Foto enviada para análise";
        content.appendChild(photo);
    }


    if (type === "ai") {

        content.appendChild(
            createMessageActions(text, message)
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
/* IMAGENS CONTEXTUAIS POR TRECHO */
/* ================================= */

const CCSIA_VISUAL_TOPICS = [
    ["Mercúrio", /\bmercúrio\b/i, "Mercury planet NASA"],
    ["Vênus", /\bvênus\b/i, "Venus planet NASA"],
    ["Terra", /\bterra\b/i, "Earth planet NASA"],
    ["Marte", /\bmarte\b/i, "Mars planet NASA"],
    ["Júpiter", /\bjúpiter\b/i, "Jupiter planet NASA"],
    ["Saturno", /\bsaturno\b/i, "Saturn planet NASA"],
    ["Urano", /\burano\b/i, "Uranus planet NASA"],
    ["Netuno", /\bnetuno\b/i, "Neptune planet NASA"],
    ["Sol", /\bsol\b/i, "Sun star NASA"],
    ["Lua", /\blua\b/i, "Earth Moon NASA"],
    ["Cérebro", /\bcérebro\b|\bencefalo\b/i, "human brain anatomy"],
    ["Célula", /\bcélula\b|\bcélulas\b/i, "animal cell biology diagram"],
    ["Dinossauros", /\bdinossauro(?:s)?\b/i, "dinosaur fossil"],
    ["Vulcão", /\bvulc(?:ão|ões)\b/i, "volcano eruption"],
    ["Robô", /\brobô(?:s)?\b|\brobótica\b/i, "educational robotics robot"],
    ["Rede neural", /\brede[s]? neur(?:al|ais)\b/i, "artificial neural network diagram"],
    ["Inteligência artificial", /\binteligência artificial\b|\bmachine learning\b/i, "artificial intelligence technology"]
];

function isSimpleOrCasualQuestion(question) {
    const raw = String(question || "").trim();
    if (!raw || raw.length < 9) return true;
    if (/^(oi|olá|ola|bom dia|boa tarde|boa noite|obrigad[oa]|valeu|tudo bem)[!?.\s]*$/i.test(raw)) return true;
    if (/^[\d\s()+*/.,=\-]+$/.test(raw)) return true;
    if (/\b(quanto é|quanto e|calcule|resolva)\b/i.test(raw) &&
        /^[\d\s()+*/.,=\-a-záéíóúãõç]+$/i.test(raw)) return true;
    return false;
}

function shouldUseInlineIllustrations(question, answer) {
    if (isSimpleOrCasualQuestion(question)) return false;
    const q = String(question || "");
    const a = String(answer || "");
    // A pergunta precisa indicar um tema visual/educativo ou a resposta precisa ser
    // uma explicação longa que contenha conceitos visuais reconhecidos.
    const explicitVisual = /\b(imagem|imagens|ilustra|visual|mostre|aparência|aparencia|foto|fotografia|planeta|sistema solar|espaço|espaco|animal|animais|planta|plantas|corpo humano|célula|celula|história|historia|monumento|arquitetura|computador|hardware|processador|robô|robo|robótica|robotica|inteligência artificial|inteligencia artificial|rede neural|cérebro|cerebro|natureza|geografia|mapa|vulcão|vulcao|oceano|dinossauro|lua|marte|estrela|galáxia|galaxia)\b/i.test(q);
    const concepts = CCSIA_VISUAL_TOPICS.filter(([, pattern]) => pattern.test(a));
    return explicitVisual || (a.length > 700 && concepts.length >= 2);
}

async function fetchCommonsImages(query) {
    try {
        const apiBase = String(window.CCSIA_CONFIG?.apiBaseUrl || window.location.origin).replace(/\/$/, "");
        const imagesPath = window.CCSIA_CONFIG?.imagesPath || "/api/images";
        const response = await fetch(`${apiBase}${imagesPath}?q=${encodeURIComponent(query)}`, {
            method: "GET",
            mode: "cors",
            cache: "no-store",
            headers: { "Accept": "application/json" }
        });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data?.images) ? data.images.slice(0, 1) : [];
    } catch (error) {
        console.warn("Imagem ilustrativa indisponível:", error);
        return [];
    }
}

function createInlineIllustration(item, label) {
    if (!item || typeof item.imageUrl !== "string" ||
        !item.imageUrl.startsWith("https://upload.wikimedia.org/")) return null;

    const figure = document.createElement("figure");
    figure.className = "ccsia-inline-illustration";
    const link = document.createElement("a");
    link.href = typeof item.pageUrl === "string" && item.pageUrl.startsWith("https://commons.wikimedia.org/wiki/")
        ? item.pageUrl : "https://commons.wikimedia.org/";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `Abrir detalhes e licença da imagem: ${label}`);
    const image = document.createElement("img");
    image.src = item.imageUrl;
    image.alt = `${label}: imagem ilustrativa`;
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => figure.remove(), { once: true });
    link.appendChild(image);
    figure.appendChild(link);
    // Não exibe legenda nem crédito abaixo da imagem. A imagem abre sua página de origem,
    // onde ficam os dados do arquivo e as informações de licença/atribuição.
    return figure;
}

async function addIllustrationsIfUseful(textElement, question, answerText = "") {
    if (!textElement || textElement.querySelector(".ccsia-inline-illustration") ||
        !shouldUseInlineIllustrations(question, answerText || textElement.textContent)) return;

    const paragraphs = Array.from(textElement.querySelectorAll("p, li, h2, h3, h4"));
    if (!paragraphs.length) return;

    const answer = answerText || textElement.textContent || "";
    const found = CCSIA_VISUAL_TOPICS.filter(([, pattern]) => pattern.test(answer));
    const explicitVisual = /\b(imagem|imagens|ilustra|visual|mostre|foto|fotografia|planeta|sistema solar|espaço|espaco|corpo humano|célula|celula|robô|robo|inteligência artificial|inteligencia artificial|rede neural|cérebro|cerebro|vulcão|vulcao|dinossauro|lua|marte|estrela|galáxia|galaxia)\b/i.test(question);

    // Prefere conceitos mencionados no próprio texto e associa cada imagem ao parágrafo
    // correspondente. No máximo três pesquisas por resposta.
    const solarSystemQuestion = /\b(sistema solar|todos os planetas|planetas do sistema solar)\b/i.test(question);
    let targets = found.slice(0, solarSystemQuestion ? 8 : 3);
    if (!targets.length && explicitVisual) {
        const q = String(question).toLowerCase();
        const topic = CCSIA_VISUAL_TOPICS.find(([label, pattern]) => pattern.test(q));
        if (topic) targets = [topic];
    }
    if (!targets.length) return;

    let searches = 0;
    const searchLimit = solarSystemQuestion ? 8 : 3;
    for (const [label, pattern, query] of targets) {
        const paragraph = paragraphs.find(el => pattern.test(el.textContent || "") &&
            !el.closest(".ccsia-inline-illustration"));
        if (!paragraph || searches >= searchLimit) continue;
        searches++;
        const images = await fetchCommonsImages(query);
        if (!images.length) continue;
        const figure = createInlineIllustration(images[0], label);
        if (figure) paragraph.insertAdjacentElement("afterend", figure);
    }
}

/* ================================= */
/* DIGITAÇÃO DA IA */
/* ================================= */

async function addTypingMessage(text, type, sourceQuestion = "", save = true) {

    const message = document.createElement("div");
    message.classList.add("message", type);

    const avatar = createAvatar(type);
    const content = document.createElement("div");
    content.classList.add("message-content");

    const name = document.createElement("div");
    name.classList.add("message-name");
    name.textContent = "CCSIA";

    const textElement = document.createElement("div");
    textElement.classList.add("message-text");

    content.appendChild(name);
    content.appendChild(textElement);
    message.appendChild(avatar);
    message.appendChild(content);
    chatContent.appendChild(message);

    let currentText = "";
    const speed = 12;
    typingStopRequested = false;

    const stop = () => { typingStopRequested = true; };
    const actions = createMessageActions(text, message, true, stop);
    content.appendChild(actions);

    try {
        // Atualiza em pequenos blocos, não a cada caractere. Recriar o HTML inteiro
        // continuamente fazia as tabelas Markdown piscarem nos celulares.
        const chunkSize = 4;
        for (let i = 0; i < text.length; i += chunkSize) {
            if (typingStopRequested) break;
            currentText += text.slice(i, i + chunkSize);
            textElement.innerHTML = formatAIResponse(currentText);
            await new Promise(resolve => setTimeout(resolve, speed * 2));
        }
    } finally {
        typingStopRequested = false;
    }

    textElement.innerHTML = formatAIResponse(currentText || text);
    if (type === "ai" && sourceQuestion) {
        await addIllustrationsIfUseful(textElement, sourceQuestion, currentText || text);
    }
    actions.replaceChildren(createCopyButton(text), createRegenerateButton(message));

    if (save) {
        saveMessage("ai", text);
    }
    return message;

}

function replaceSavedAIAnswer(oldAnswer, newAnswer) {
    const conversation = getCurrentConversation();
    if (!conversation) return false;
    for (let i = conversation.messages.length - 1; i >= 0; i--) {
        if (conversation.messages[i].role === "ai" && conversation.messages[i].content === oldAnswer) {
            conversation.messages[i].content = newAnswer;
            conversation.messages[i].timestamp = Date.now();
            conversation.updatedAt = Date.now();
            const conversations = getConversations();
            const index = conversations.findIndex(item => item.id === conversation.id);
            if (index !== -1) {
                conversations[index] = conversation;
                saveConversations(conversations);
                renderHistory();
            }
            return true;
        }
    }
    return false;
}

function getChatHistoryForAI({ excludeLastAI = false } = {}) {
    const conversation = getCurrentConversation();
    if (!conversation || !Array.isArray(conversation.messages)) return [];

    let messages = conversation.messages
        .filter(item =>
            (item.role === "user" || item.role === "ai") &&
            typeof item.content === "string" &&
            item.content.trim()
        )
        .map(item => ({
            role: item.role === "ai" ? "assistant" : "user",
            content: item.content.trim()
        }));

    // Na regeneração, removemos a resposta antiga para não fazer o modelo
    // tratar a resposta que estamos substituindo como parte do contexto.
    if (excludeLastAI) {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === "assistant") {
                messages.splice(i, 1);
                break;
            }
        }
    }

    return messages.slice(-20);
}

async function regenerateAnswer(question, oldAnswer = "") {
    const loadingMessage = addLoadingMessage();
    try {
        const apiBase = String(window.CCSIA_CONFIG?.apiBaseUrl || window.location.origin).replace(/\/$/, "");
        const apiPath = window.CCSIA_CONFIG?.apiPath || "/api/chat";
        const response = await fetch(`${apiBase}${apiPath}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: question,
                studyMode,
                history: getChatHistoryForAI({ excludeLastAI: true }),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
            })
        });
        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json") ? await response.json() : null;
        loadingMessage.remove();
        if (!response.ok || !data?.answer) {
            addMessage(data?.error || "Não foi possível gerar uma nova resposta do CCSIA.", "ai");
            return;
        }
        replaceSavedAIAnswer(oldAnswer, data.answer);
        await addTypingMessage(data.answer, "ai", question, false);
    } catch (error) {
        loadingMessage.remove();
        await addTypingMessage("Não consegui conectar ao servidor do CCSIA.", "ai", question);
    }
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


    chatContent.appendChild(
        message
    );


    const nearBottom =
        chatContent.scrollHeight -
        chatContent.scrollTop -
        chatContent.clientHeight < 80;

    if (nearBottom) {
        chatContent.scrollTop =
            chatContent.scrollHeight;
    }


    return message;

}


/* ================================= */
/* RESPOSTAS FIXAS (FEIRA DE CIÊNCIAS) */
/* ================================= */

/**
 * Normaliza o texto para comparação flexível:
 * minúsculas, sem acentos, sem pontuação e espaços colapsados.
 */
function normalizeForMatch(text) {
    return String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Verifica se a mensagem corresponde a uma das duas perguntas
 * da dinâmica da feira de ciências e devolve a resposta fixa,
 * ou null se não for o caso (segue o fluxo normal da API).
 */
function getFixedScienceFairResponse(message) {
    const normalized = normalizeForMatch(message);
    if (!normalized || normalized.length < 12) {
        return null;
    }

    // Evita acionar com mensagens genéricas sobre IA
    const hasEducationContext =
        /\beducacao\b|\beducacional\b|\bescola\b|\bestudante\b|\bestudantes\b|\baluno\b|\balunos\b|\bprofessor\b|\bprofessores\b/.test(normalized);

    // ---- PERGUNTA 1: IA utilizada somente por estudantes ----
    // Exemplos: "Na educação a IA é utilizada somente por estudantes"
    const isOnlyStudentsClaim =
        hasEducationContext &&
        (/\bia\b|\binteligencia artificial\b/.test(normalized)) &&
        (
            /\bsomente\b|\bapenas\b|\bexclusivamente\b|\bunica\s*mente\b|\bso\s+por\b|\bso\s+pelos?\b/.test(normalized) ||
            /\busada\s+so\s+por\b|\butilizada\s+so\s+por\b/.test(normalized)
        ) &&
        (/\bestudante\b|\bestudantes\b|\baluno\b|\balunos\b/.test(normalized)) &&
        // Exige a ideia de "somente/apenas" ligada a estudantes (não professores)
        !/\be\s+(para\s+)?professores?\b|\btanto\s+.*professores?\b/.test(normalized);

    if (isOnlyStudentsClaim) {
        return "FALSA – Na apresentação, a IA é descrita como apoio tanto para estudantes quanto para professores, ajudando em dúvidas, pesquisas, explicações, preparação de materiais e outras tarefas educacionais.";
    }

    // ---- PERGUNTA 2: ChatGPT / Gemini / Copilot exclusivos da educação ----
    // Exemplos: "O ChatGPT, Gemini e Copilot são utilizados apenas para educação"
    const mentionsTools =
        /\bchatgpt\b/.test(normalized) ||
        /\bgemini\b/.test(normalized) ||
        /\bcopilot\b/.test(normalized) ||
        /\bessas ferramentas\b/.test(normalized);

    const exclusiveEducationClaim =
        mentionsTools &&
        (
            /\bapenas\s+(para\s+)?(a\s+)?educacao\b|\bsomente\s+(para\s+)?(a\s+|na\s+)?educacao\b|\bexclusiv[oa]s?\s+(da|para|para\s+fins)\s+(a\s+)?educacao\b|\bexclusivamente\s+(para\s+)?(fins\s+)?educacionais?\b|\bso\s+(para\s+)?(a\s+)?educacao\b|\butilizados?\s+apenas\s+para\s+educacao\b|\bferramentas\s+exclusivas\s+da\s+educacao\b|\busadas?\s+somente\s+na\s+educacao\b/.test(normalized) ||
            (/\bexclusiv/.test(normalized) && /\beducacao\b|\beducacional\b/.test(normalized)) ||
            (/\bapenas\b|\bsomente\b/.test(normalized) && /\beducacao\b|\beducacional\b/.test(normalized) && !/\bprogramacao\b|\bconteudo\b|\boutras\s+areas\b/.test(normalized))
        );

    if (exclusiveEducationClaim) {
        return "FALSA – Na apresentação, ChatGPT, Gemini e Copilot são citados como ferramentas úteis na educação, mas também são usados em outras áreas, como programação e geração de conteúdo geral, não sendo exclusivos para fins educacionais.";
    }

    return null;
}


/* ================================= */
/* ENVIAR */
/* ================================= */

async function sendMessage() {

    // Desliga o microfone ao enviar
    if (isListening) {
        stopSpeechRecognition();
    }

    const message = messageInput.value.trim() || (pendingImageData ? "Analise esta imagem e descreva o que você observa." : "");
    const imageData = pendingImageData;


    if (!message) {
        return;
    }


    const existingWelcome =
        document.getElementById(
            "welcome"
        );


    if (existingWelcome) {

        existingWelcome.remove();

    }


    /*
       Salva a pergunta.
       Se não existir conversa,
       cria automaticamente.
    */

    addMessage(
        message,
        "user",
        true,
        imageData
    );

    pendingImageData = null;
    cameraButton?.classList.remove("has-photo");
    if (cameraButton) cameraButton.title = "Tirar foto";
    messageInput.placeholder = "Pergunte ao CCSIA...";


    messageInput.value =
        "";


    resetTextarea();


    // Respostas fixas da feira de ciências: não chama a API
    const fixedAnswer = getFixedScienceFairResponse(message);
    if (fixedAnswer) {
        await addTypingMessage(fixedAnswer, "ai", message);
        return;
    }


    const loadingMessage =
        addLoadingMessage();


    try {

        const response =
            await fetch(
                `${String(window.CCSIA_CONFIG?.apiBaseUrl || window.location.origin).replace(/\/$/, "")}${window.CCSIA_CONFIG?.apiPath || "/api/chat"}`,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            message:
                                message,

                            studyMode:
                                studyMode,

                            history:
                                getChatHistoryForAI(),

                            timeZone:
                                Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",

                            imageData

                        })

                }
            );


        const contentType =
            response.headers.get("content-type") || "";

        const data =
            contentType.includes("application/json")
                ? await response.json()
                : null;


        loadingMessage.remove();


        if (!response.ok) {

            const errorMessage =
                data?.error ||
                "Desculpe, ocorreu um erro ao falar com o CCSIA.";

            addMessage(
                errorMessage,
                "ai"
            );


            console.error(
                "Erro da API:",
                response.status,
                data
            );


            return;

        }


        if (!data?.answer) {

            addMessage(
                "O CCSIA recebeu uma resposta inválida do servidor.",
                "ai"
            );


            console.error(
                "Resposta inválida:",
                data
            );


            return;

        }


        await addTypingMessage(
            data.answer,
            "ai",
            message
        );


    } catch (error) {

        console.error(
            "Erro:",
            error
        );


        loadingMessage.remove();


        await addTypingMessage(
            "Não consegui conectar ao servidor do CCSIA. Verifique se o servidor está funcionando.",
            "ai"
        );


    } finally {
        // A interface continua utilizável mesmo enquanto a CCSIA termina de responder.
    }

}


/* ================================= */
/* MICROFONE / TRANSCRIÇÃO DE VOZ */
/* ================================= */

const SpeechRecognitionAPI =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

const isMobileDevice =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
        .test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 &&
        /Mobile|Tablet/i.test(navigator.userAgent));

let speechRecognition = null;
let isListening = false;

/* Texto já confirmado no campo (só recebe resultados finais) */
let confirmedText = "";

function showMicMessage(text) {
    const existing =
        document.getElementById("micToast");

    if (existing) {
        existing.remove();
    }

    const toast =
        document.createElement("div");

    toast.id = "micToast";
    toast.setAttribute("role", "status");
    toast.textContent = text;

    toast.style.cssText =
        "position:fixed;bottom:90px;left:50%;" +
        "transform:translateX(-50%);" +
        "max-width:90%;padding:12px 18px;" +
        "background:#1b1816;color:#f5f5f4;" +
        "border-radius:12px;font-size:14px;" +
        "font-family:Inter,sans-serif;" +
        "box-shadow:0 8px 30px rgba(0,0,0,.25);" +
        "z-index:9999;text-align:center;" +
        "line-height:1.4;";

    document.body.appendChild(toast);

    setTimeout(function () {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 4500);
}

function updateMicButtonState(listening) {
    isListening = listening;

    if (!micButton) {
        return;
    }

    if (listening) {
        micButton.classList.add("listening");
        micButton.setAttribute(
            "aria-label",
            "Parar gravação"
        );
        micButton.setAttribute(
            "title",
            "Parar gravação"
        );
    } else {
        micButton.classList.remove("listening");
        micButton.setAttribute(
            "aria-label",
            "Falar com o microfone"
        );
        micButton.setAttribute(
            "title",
            "Falar com o microfone"
        );
    }
}

/*
   Remove palavras/frases repetidas em sequência
   ex: "você você você" → "você"
       "por por por" → "por"
*/
function collapseRepeatedWords(text) {
    if (!text) {
        return "";
    }

    let result =
        text.replace(/\s+/g, " ").trim();

    // Repetição de palavra única
    result = result.replace(
        /\b([^\s]+)(\s+\1\b)+/gi,
        "$1"
    );

    // Repetição de 2 palavras ("foi você foi você")
    result = result.replace(
        /\b([^\s]+\s+[^\s]+)(\s+\1\b)+/gi,
        "$1"
    );

    // Repetição de 3 palavras
    result = result.replace(
        /\b([^\s]+\s+[^\s]+\s+[^\s]+)(\s+\1\b)+/gi,
        "$1"
    );

    return result.replace(/\s+/g, " ").trim();
}

/*
   Só adiciona o novo trecho se ele ainda não estiver
   no final do texto (evita duplicar no mobile).
*/
function appendUniqueTranscript(base, addition) {
    const a =
        (addition || "").replace(/\s+/g, " ").trim();

    if (!a) {
        return (base || "").trim();
    }

    let b =
        (base || "").replace(/\s+/g, " ").trim();

    if (!b) {
        return collapseRepeatedWords(a);
    }

    const bLower = b.toLowerCase();
    const aLower = a.toLowerCase();

    // Já termina exatamente com o novo trecho
    if (bLower.endsWith(aLower)) {
        return collapseRepeatedWords(b);
    }

    // O novo trecho já está contido no final (sobreposição)
    // ex: base="você foi" addition="foi criado" → "você foi criado"
    const bWords = b.split(" ");
    const aWords = a.split(" ");

    let overlap = 0;
    const maxCheck =
        Math.min(bWords.length, aWords.length);

    for (let k = maxCheck; k >= 1; k--) {
        const endOfBase =
            bWords.slice(-k).join(" ").toLowerCase();
        const startOfAdd =
            aWords.slice(0, k).join(" ").toLowerCase();

        if (endOfBase === startOfAdd) {
            overlap = k;
            break;
        }
    }

    if (overlap > 0) {
        const merged =
            b +
            " " +
            aWords.slice(overlap).join(" ");
        return collapseRepeatedWords(merged);
    }

    return collapseRepeatedWords(b + " " + a);
}

function setInputText(text) {
    const clean =
        collapseRepeatedWords(text);

    messageInput.value = clean;

    messageInput.dispatchEvent(
        new Event("input")
    );
}

function stopSpeechRecognition() {
    isListening = false;

    if (speechRecognition) {
        try {
            speechRecognition.stop();
        } catch (e) {
            // ignora se já estiver parado
        }
    }

    // Garante texto limpo ao parar
    confirmedText =
        collapseRepeatedWords(
            messageInput.value
        );
    setInputText(confirmedText);

    updateMicButtonState(false);
}

function startSpeechRecognition() {
    if (!SpeechRecognitionAPI) {
        showMicMessage(
            "Seu navegador não é compatível com reconhecimento de voz. " +
            "Tente usar o Google Chrome ou o Microsoft Edge."
        );
        return;
    }

    // Sempre recria no mobile — o motor de voz do celular
    // costuma “grudar” estado antigo e gerar repetição
    if (speechRecognition && isMobileDevice) {
        try {
            speechRecognition.onresult = null;
            speechRecognition.onend = null;
            speechRecognition.onerror = null;
            speechRecognition.onstart = null;
            speechRecognition.abort();
        } catch (e) {
            // ok
        }
        speechRecognition = null;
    }

    if (!speechRecognition) {
        speechRecognition =
            new SpeechRecognitionAPI();

        speechRecognition.lang = "pt-BR";
        speechRecognition.continuous = true;
        /*
           No celular, interimResults causa a maior parte
           das repetições. Usamos só resultados finais.
           No PC mantém interim para feedback ao vivo.
        */
        speechRecognition.interimResults =
            !isMobileDevice;
        speechRecognition.maxAlternatives = 1;

        speechRecognition.onstart = function () {
            updateMicButtonState(true);
        };

        speechRecognition.onresult = function (event) {
            let interim = "";

            /*
               Só processa resultados NOVOS (resultIndex).
               Só grava de forma permanente o que for isFinal.
            */
            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {
                const result =
                    event.results[i];
                const transcript =
                    (result[0] &&
                        result[0].transcript) ||
                    "";

                if (!transcript.trim()) {
                    continue;
                }

                if (result.isFinal) {
                    confirmedText =
                        appendUniqueTranscript(
                            confirmedText,
                            transcript
                        );
                } else if (!isMobileDevice) {
                    interim += transcript;
                }
            }

            if (isMobileDevice) {
                // Mobile: só texto final confirmado
                setInputText(confirmedText);
            } else {
                // PC: final + interim visual (interim não grava)
                const display =
                    appendUniqueTranscript(
                        confirmedText,
                        interim
                    );
                // Mostra interim sem gravar nele em confirmedText
                messageInput.value =
                    collapseRepeatedWords(
                        (
                            confirmedText +
                            " " +
                            interim
                        ).replace(/\s+/g, " ").trim()
                    );
                messageInput.dispatchEvent(
                    new Event("input")
                );
            }
        };

        speechRecognition.onerror = function (event) {
            console.warn(
                "Erro no reconhecimento de voz:",
                event.error
            );

            if (
                event.error === "not-allowed" ||
                event.error === "service-not-allowed"
            ) {
                showMicMessage(
                    "Permissão do microfone negada. " +
                    "Para usar a função de voz, permita o acesso " +
                    "ao microfone nas configurações do navegador."
                );
                isListening = false;
                updateMicButtonState(false);
            } else if (
                event.error === "no-speech"
            ) {
                // silêncio — onend reinicia se ainda estiver ouvindo
            } else if (
                event.error === "aborted"
            ) {
                // usuário parou ou enviou — ok
            } else {
                showMicMessage(
                    "Não foi possível usar o microfone. " +
                    "Verifique as permissões e tente novamente."
                );
                isListening = false;
                updateMicButtonState(false);
            }
        };

        speechRecognition.onend = function () {
            if (isListening) {
                // Limpa visual de interim e mantém só o confirmado
                setInputText(confirmedText);

                try {
                    speechRecognition.start();
                } catch (e) {
                    isListening = false;
                    updateMicButtonState(false);
                }
            } else {
                updateMicButtonState(false);
            }
        };
    }

    confirmedText =
        collapseRepeatedWords(
            messageInput.value
        );
    setInputText(confirmedText);

    try {
        speechRecognition.start();
    } catch (e) {
        console.warn(
            "Não foi possível iniciar o microfone:",
            e
        );
        showMicMessage(
            "Não foi possível iniciar o microfone. " +
            "Tente novamente."
        );
        isListening = false;
        updateMicButtonState(false);
    }
}

function toggleSpeechRecognition() {
    if (isListening) {
        stopSpeechRecognition();
    } else {
        startSpeechRecognition();
    }
}

if (micButton) {
    micButton.addEventListener(
        "click",
        function (event) {
            event.preventDefault();
            toggleSpeechRecognition();
        }
    );
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


sendButton.addEventListener(
    "click",
    sendMessage
);


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


        removeStorage(CURRENT_KEY);


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
/* MODO ESTUDO */
/* ================================= */

function updateStudyModeButton() {
    if (!studyModeButton) return;
    studyModeButton.classList.toggle("active", studyMode);
    studyModeButton.textContent = studyMode ? "🎓✓" : "🎓";
    studyModeButton.title = studyMode ? "Modo estudo ativado" : "Ativar modo estudo";
    studyModeButton.setAttribute("aria-label", studyModeButton.title);
}

if (studyModeButton) {
    studyModeButton.addEventListener("click", function() {
        studyMode = !studyMode;
        writeStorage(STUDY_MODE_KEY, String(studyMode));
        updateStudyModeButton();
    });
}

updateStudyModeButton();


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


        updateLogos();
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


updateLogos();
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
    // A barra lateral deve ser reconstruída sempre que o site abrir.
    renderHistory();

    if (!currentConversationId) {
        return;
    }


    const conversation =
        getCurrentConversation();


    if (!conversation) {

        currentConversationId =
            null;


        removeStorage(CURRENT_KEY);


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
