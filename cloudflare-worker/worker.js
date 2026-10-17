
const SYSTEM_PROMPT = `Você é a CCSIA — Caixinha do Saber Inteligência Artificial, uma assistente educacional inteligente, amigável e curiosa, que conversa em português brasileiro.

IDENTIDADE E PRIORIDADES:
- Seu nome é CCSIA, sigla de Caixinha do Saber Inteligência Artificial.
- Sua prioridade principal é inteligência artificial: como funciona, modelos, ferramentas, programação com IA, aplicações, ética e futuro da tecnologia.
- Quando a pergunta envolver IA, ofereça uma resposta especialmente útil, clara e bem explicada.
- Responda também a perguntas escolares, dúvidas gerais, traduções, ciências, matemática, tecnologia e outros assuntos.

ESTILO DE CONVERSA:
- Seja natural, simpática, inteligente e acessível.
- Use emojis com moderação e de maneira contextual.
- Para perguntas simples, responda diretamente, geralmente em uma a três frases.
- Para perguntas complexas, explique por etapas e use exemplos quando ajudarem.
- Use títulos, listas, tabelas e código quando facilitarem a compreensão.
- Não repita a pergunta nem use introduções desnecessárias.
- Adapte o nível de detalhe ao pedido.

QUALIDADE E PRECISÃO:
- Não invente informações, fontes ou capacidades.
- Quando não tiver certeza, deixe isso claro.
- Diferencie fatos de opiniões e hipóteses.
- Não afirme que pesquisou na internet ou executou ações se isso não aconteceu.
- Não afirme possuir acesso a arquivos ou informações privadas indisponíveis na conversa.

IDENTIDADE:
- CCSIA significa Caixinha do Saber Inteligência Artificial.
- É um projeto educacional de inteligência artificial.

OBJETIVO:
Tornar o conhecimento mais acessível e despertar a curiosidade, especialmente sobre inteligência artificial, de forma clara, útil e envolvente.`;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json; charset=utf-8"
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders()
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    if (
      request.method === "GET" &&
      (url.pathname === "/" || url.pathname === "/health")
    ) {
      return json({
        ok: true,
        service: "CCSIA",
        message: "Worker funcionando!",
        endpoint: "/api/chat"
      });
    }

    if (url.pathname !== "/api/chat") {
      return json({
        error: "Endpoint não encontrado. Use /api/chat."
      }, 404);
    }

    if (request.method !== "POST") {
      return json({
        error: "Método não permitido. Use POST."
      }, 405);
    }

    if (!env.GROQ_API_KEY) {
      return json({
        error: "A chave GROQ_API_KEY não está configurada nos secrets do Worker."
      }, 503);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return json({
        error: "O corpo da requisição precisa ser um JSON válido."
      }, 400);
    }

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return json({
        error: "Digite uma pergunta antes de enviar."
      }, 400);
    }

    if (message.length > 12000) {
      return json({
        error: "Sua mensagem é muito longa. Tente resumir."
      }, 413);
    }

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: env.GROQ_MODEL || "openai/gpt-oss-120b",
            messages: [
              {
                role: "system",
                content: SYSTEM_PROMPT
              },
              {
                role: "user",
                content: message
              }
            ],
            max_tokens: 900,
            temperature: 0.6
          })
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error(
          "Erro da API Groq:",
          response.status,
          result?.error?.message || "Erro desconhecido"
        );

        return json({
          error:
            response.status === 401
              ? "A Groq recusou a chave configurada. Verifique o secret GROQ_API_KEY."
              : response.status === 429
                ? "A Groq está com limite de requisições ou uso atingido. Tente novamente mais tarde."
                : "A Groq não conseguiu processar a solicitação. Tente novamente mais tarde.",
          status: response.status
        }, 502);
      }

      const answer = result?.choices?.[0]?.message?.content;

      if (typeof answer !== "string" || !answer.trim()) {
        return json({
          error: "A IA não retornou uma resposta. Tente novamente."
        }, 502);
      }

      return json({
        answer: answer.trim()
      });
    } catch (error) {
      console.error("Erro interno da CCSIA:", error);

      return json({
        error: "Não foi possível conectar à Groq neste momento."
      }, 502);
    }
  }
};
