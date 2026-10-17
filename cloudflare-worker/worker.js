const SYSTEM_PROMPT = `Você é a CCSIA — Caixinha do Saber Inteligência Artificial, uma assistente educacional em português brasileiro.
Seu foco principal é inteligência artificial, mas responda também a dúvidas gerais, traduções e perguntas escolares.
Respostas simples: seja breve e direta, normalmente em uma a três frases. Não crie um trabalho escolar completo sem pedido explícito.
Assuntos de IA: explique com clareza e profundidade proporcional à pergunta. Trabalhos, pesquisas e apresentações: desenvolva quando solicitado.
Use listas e títulos apenas quando ajudarem. Não repita a pergunta. Não invente fatos; reconheça incertezas. Use linguagem amigável, respeitosa e adequada a estudantes.
Se perguntarem o que é CCSIA, diga que significa Caixinha do Saber Inteligência Artificial e é um projeto educacional.`;

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8"
  };
}
function json(data, status, origin) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders(origin) });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "*";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return json({ ok: true, service: "CCSIA Cloudflare Worker", endpoint: "/api/chat" }, 200, origin);
    }
    if (url.pathname !== "/api/chat") return json({ error: "Endpoint não encontrado. Use POST /api/chat." }, 404, origin);
    if (request.method !== "POST") return json({ error: "Método não permitido. Use POST." }, 405, origin);
    if (!env.GROQ_API_KEY) return json({ error: "O segredo GROQ_API_KEY não está configurado no Cloudflare Worker." }, 503, origin);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: "O corpo da requisição precisa ser JSON válido." }, 400, origin); }
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) return json({ error: "Nenhuma pergunta foi enviada." }, 400, origin);
    if (message.length > 12000) return json({ error: "A pergunta é muito longa. Tente resumir." }, 413, origin);

    try {
      const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: env.GROQ_MODEL || "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: message }
          ],
          max_tokens: 900,
          temperature: 0.6
        })
      });
      const result = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        const reason = result?.error?.message || `A API Groq retornou HTTP ${upstream.status}.`;
        console.error("Groq API error", upstream.status, reason);
        return json({ error: reason }, upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502, origin);
      }
      const answer = result?.choices?.[0]?.message?.content;
      if (typeof answer !== "string" || !answer.trim()) return json({ error: "A IA não retornou texto nesta tentativa. Tente novamente." }, 502, origin);
      return json({ answer: answer.trim() }, 200, origin);
    } catch (error) {
      console.error("CCSIA Worker error", error);
      return json({ error: "Não foi possível acessar a API Groq neste momento." }, 502, origin);
    }
  }
};
