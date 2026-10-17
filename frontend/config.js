/* Configuração pública da conexão com a API da CCSIA.
   Este arquivo não deve conter chaves privadas. */
window.CCSIA_CONFIG = {
    // URL do Cloudflare Worker que conversa com a API Groq.
    // Se o nome do seu Worker for diferente, altere somente esta URL.
    apiBaseUrl: "https://ccsia-2026.ccsia.workers.dev",
    apiPath: "/api/chat"
};
