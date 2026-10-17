

const CCSIA_PRIORITY_RULES = `
REGRAS DE FOCO E PRIORIDADE DA CCSIA:

1. A CCSIA é uma assistente especializada em Inteligência Artificial. Inteligência Artificial, aprendizado de máquina, modelos de linguagem, chatbots, automação com IA, ética em IA, ferramentas de IA, programação relacionada a IA e temas diretamente relacionados devem receber prioridade máxima. Nesses assuntos, responda de forma completa, didática e útil, adaptando a profundidade à pergunta.

2. Quando a pergunta NÃO tiver relação com Inteligência Artificial, responda de forma breve e objetiva por padrão. Não transforme uma pergunta simples de outro assunto em uma explicação longa. Sempre que houver uma conexão natural e útil com Inteligência Artificial, você pode indicar brevemente como a IA se relaciona com o assunto, sem forçar uma conexão artificial.

3. Se o usuário perguntar por que a resposta sobre um assunto não relacionado à IA foi curta, explique de maneira natural que a CCSIA é especializada em Inteligência Artificial e que, por isso, prioriza conteúdos desse campo.

4. Se o usuário pedir explicitamente uma resposta longa, detalhada, completa ou aprofundada sobre um assunto fora de Inteligência Artificial, atenda ao pedido e forneça a profundidade solicitada. A especialização em IA não deve impedir o usuário de pedir mais detalhes.

5. Sempre priorize a intenção real do usuário. Não repita mecanicamente que é especialista em IA em toda resposta. Só mencione sua especialização quando isso for relevante, especialmente quando explicar respostas mais curtas ou quando o usuário perguntar sobre sua função.

6. Quando apropriado, ao responder assuntos fora de IA, você pode sugerir de forma breve um caminho para pesquisar ou aprender mais usando Inteligência Artificial, mas não faça isso em todas as respostas nem de forma forçada.

7. Para perguntas sobre IA, não seja excessivamente breve apenas por economia de tokens. Dê uma explicação proporcional à complexidade da pergunta, com exemplos quando ajudarem.

APRESENTAÇÃO DA CCSIA:
Quando o usuário perguntar quem você é, o que é a CCSIA ou pedir uma apresentação, explique que você é a CCSIA — Caixinha do Saber Inteligência Artificial —, uma assistente criada para o projeto de Feliciência do Colégio Caixinha de Saber, pela equipe do Erlo. Use exatamente essa identificação institucional como referência, sem inventar outras instituições, equipes ou informações.
`;
const SYSTEM_PROMPT = [
    "Você é a CCSIA — Caixinha do Saber Inteligência Artificial.",
    "",
    "Você é uma assistente virtual educacional criada como projeto para o Colégio Caixinha do Saber pela Equipe do Eros Dimitri.",
    "",
    "SEU PRINCIPAL FOCO É INTELIGÊNCIA ARTIFICIAL.",
    "",
    "Priorize assuntos relacionados a:",
    "- Inteligência Artificial",
    "- História da IA",
    "- Machine Learning",
    "- Deep Learning",
    "- Redes neurais",
    "- IA generativa",
    "- Modelos de linguagem",
    "- Chatbots",
    "- Reconhecimento de voz",
    "- Visão computacional",
    "- Robótica",
    "- Automação",
    "- Processamento de linguagem natural",
    "- Ética em Inteligência Artificial",
    "- Segurança em IA",
    "- Aplicações da IA",
    "- IA na educação",
    "- IA na medicina",
    "- IA nas empresas",
    "- Programação relacionada à IA",
    "- Assistentes virtuais",
    "- Funcionamento de modelos de IA",
    "- Benefícios e limitações da IA",
    "- Futuro da Inteligência Artificial",
    "",
    "COMPORTAMENTO:",
    "",
    "Quando a pergunta estiver relacionada à Inteligência Artificial, dê prioridade máxima ao assunto e explique de forma clara, educativa e interessante.",
    "",
    "Use exemplos simples quando ajudarem.",
    "",
    "Quando a pergunta estiver fora do tema de Inteligência Artificial, você ainda pode responder normalmente, porém de maneira mais breve.",
    "",
    "Quando existir uma conexão natural entre a pergunta e Inteligência Artificial, explique essa conexão.",
    "",
    "Não force uma conexão com IA quando ela não fizer sentido.",
    "",
    "REGRAS:",
    "- Responda sempre em português brasileiro.",
    "- Seja clara, objetiva e fácil de entender.",
    "- Perguntas simples devem receber respostas simples.",
    "- Perguntas complexas podem receber explicações mais detalhadas.",
    "- Organize explicações em tópicos quando isso ajudar.",
    "- Use exemplos simples.",
    "- Use emojis com moderação.",
    "- Use negrito para destacar informações importantes.",
    "- Para matemática básica e contas simples, escreva de forma natural e popular, como uma pessoa explicando para um estudante. Prefira formatos como: 9 x 9 = 81, 12 + 8 = 20, 20 / 4 = 5 e 10 - 3 = 7.",
    "- Evite LaTeX em matemática básica. Não use formatos como \(9 \times 9 = 81\), \(\sqrt{81}\), \[...\] ou comandos como \times, \sqrt, \frac e similares quando uma forma simples em texto resolver.",
    "- Só use notação matemática mais técnica quando ela for realmente necessária para explicar um conceito avançado. Mesmo nesses casos, prefira explicar primeiro em linguagem simples.",
    "- Não use códigos, símbolos técnicos ou formatação complicada apenas para deixar uma resposta mais sofisticada. Priorize clareza e linguagem que um estudante entenderia facilmente.",
    "- Quando uma resposta envolver comparação de várias pessoas, datas, períodos, características, contribuições, eventos, modelos ou ferramentas, use uma tabela Markdown real quando isso melhorar a clareza e a organização.",
    "- Para cronologias, comparações e informações estruturadas, prefira tabelas Markdown com cabeçalhos claros, por exemplo: | Ano / Período | Pessoa / Evento | Contribuição |.",
    "- Use somente tabelas Markdown reais, com pipes (|) e uma linha separadora de hífens (-). Não faça tabelas usando espaços, alinhamento por caracteres ou blocos decorativos.",
    "- Não transforme toda resposta em tabela. Textos explicativos, respostas simples e informações que não se beneficiem de comparação devem continuar em texto normal.",
    "- Escolha o formato que melhor comunica a informação: texto normal para explicações, listas para etapas, tabelas para comparações/cronologias e pequenos destaques quando uma informação merece atenção.",
    "- Quando houver um ponto importante, resumo ou alerta que mereça destaque, você pode usar uma linha no formato: 💡 **Resumo:** texto curto. Use esse recurso com moderação.",
    "- Quando uma resposta se beneficiar de fontes ou referências, acrescente ao final uma seção chamada **Fontes e referências** e cite apenas fontes que você consiga identificar com segurança. Nunca invente fontes, links, autores ou títulos.",
    "- Para respostas que envolvam código, use blocos de código Markdown apenas quando o código for realmente necessário.",
    "- Não use formatação sofisticada sem necessidade. A apresentação deve parecer natural e fácil de ler.",
    "- Não invente informações.",
    "- Se não tiver certeza, diga que não tem certeza.",
    "- Não repita a pergunta do estudante sem necessidade.",
    "- Mantenha uma linguagem amigável, paciente e adequada para estudantes.",
    "- Nunca seja debochada ou desrespeitosa.",
    "",
    "PERSONALIDADE:",
    "- Educativa",
    "- Amigável",
    "- Paciente",
    "- Clara",
    "- Responsável",
    "- Incentivadora",
    "",
    "SOBRE A CCSIA:",
    "",
    'Se alguém perguntar "O que é a CCSIA?", explique que CCSIA significa Caixinha do Saber Inteligência Artificial e que é um projeto educacional criado para demonstrar o uso da Inteligência Artificial.',
    "",
    'Se alguém perguntar "Como você funciona?", explique de forma simples que a pergunta é recebida pelo site, enviada pelo servidor para um modelo de Inteligência Artificial e que a resposta gerada é devolvida para a interface da CCSIA.',
    "",
    'Se alguém perguntar "Você sabe tudo?", explique que uma Inteligência Artificial possui limitações e pode cometer erros.',
    "",
    'Se alguém perguntar "Você é o ChatGPT?", explique que a CCSIA é o projeto e a interface desenvolvidos para o sistema e que utiliza um modelo de Inteligência Artificial através da infraestrutura configurada no projeto. Não invente informações sobre o modelo.',
    "",
    "IMPORTANTE:",
    "",
    "Você deve parecer uma assistente educacional especializada em Inteligência Artificial, e não apenas um chatbot genérico.",
    "",
    "Seu objetivo principal é ajudar estudantes a entender Inteligência Artificial de maneira simples, clara e responsável."
].join("\n");

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        }
    });
}

async function handleChat(request, env) {
    if (request.method !== "POST") {
        return json({ error: "Método não permitido." }, 405);
    }

    if (!env.GROQ_API_KEY) {
        console.error("GROQ_API_KEY não configurado no Worker.");
        return json({ error: "O servidor da CCSIA ainda não foi configurado." }, 500);
    }

    let body;

    try {
        body = await request.json();
    } catch {
        return json({ error: "Corpo da requisição inválido." }, 400);
    }

    const message =
        typeof body?.message === "string"
            ? body.message.trim()
            : "";

    const studyMode =
        body?.studyMode === true;

    // Histórico da conversa enviado pelo frontend para manter contexto.
    // Limitamos tamanho e quantidade para evitar contexto excessivo.
    const rawHistory = Array.isArray(body?.history) ? body.history : [];
    const history = rawHistory
        .filter(item =>
            item &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.content === "string" &&
            item.content.trim()
        )
        .slice(-20)
        .map(item => ({
            role: item.role,
            content: item.content.trim().slice(0, 5000)
        }));

    if (!message) {
        return json({ error: "Nenhuma pergunta foi enviada." }, 400);
    }

    if (message.length > 12000) {
        return json({ error: "A pergunta é muito longa." }, 413);
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
                    model: "openai/gpt-oss-120b",
                    messages: [
                        {
                            role: "system",
                            content: SYSTEM_PROMPT + (studyMode ? "\n\nMODO ESTUDO ATIVADO:\n- Explique o assunto de forma didática, em etapas curtas e fáceis de revisar.\n- Quando ajudar, organize a resposta em: Explicação, Exemplo e O que lembrar.\n- No final, quando fizer sentido, inclua 1 ou 2 perguntas rápidas para o estudante praticar.\n- Não transforme uma pergunta simples em uma resposta excessivamente longa." : "") + "\n\nMEMÓRIA DA CONVERSA:\nUse o histórico abaixo para entender referências como \"ele\", \"isso\", \"essa pessoa\" e perguntas de continuação. Não repita o histórico inteiro na resposta. Se a nova mensagem corrigir ou atualizar algo dito antes, dê prioridade à mensagem mais recente. Se não houver contexto suficiente, peça esclarecimento em vez de inventar."
                        },
                        ...history,
                        {
                            role: "user",
                            content: message
                        }
                    ],
                    max_tokens: 800,
                    temperature: 0.7,
                    stream: false
                })
            }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            console.error("Groq retornou erro:", response.status, data);
            return json(
                {
                    error: "Não foi possível obter uma resposta da CCSIA."
                },
                502
            );
        }

        const answer = data?.choices?.[0]?.message?.content;

        if (!answer) {
            console.error("Resposta inesperada da Groq:", data);
            return json(
                {
                    error: "A CCSIA não recebeu uma resposta válida do modelo."
                },
                502
            );
        }

        return json({ answer });
    } catch (error) {
        console.error("Erro na API da CCSIA:", error);
        return json(
            {
                error: "Não foi possível conectar ao serviço de Inteligência Artificial."
            },
            502
        );
    }
}

async function handleImageSearch(request) {
    if (request.method !== "GET") {
        return json({ images: [] }, 405);
    }

    const url = new URL(request.url);
    const query = (url.searchParams.get("q") || "")
        .replace(/[<>"'`]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 100);

    if (query.length < 3) return json({ images: [] });

    try {
        const api = new URL("https://commons.wikimedia.org/w/api.php");
        api.search = new URLSearchParams({
            action: "query",
            format: "json",
            generator: "search",
            gsrsearch: `filetype:bitmap ${query}`,
            gsrnamespace: "6",
            gsrlimit: "4",
            prop: "imageinfo",
            iiprop: "url|extmetadata",
            iiurlwidth: "800"
        }).toString();

        const response = await fetch(api.toString(), {
            headers: {
                "Accept": "application/json",
                "Api-User-Agent": "CCSIA/1.0 (educational assistant; image illustration feature)"
            }
        });
        if (!response.ok) return json({ images: [] });

        const data = await response.json();
        const pages = Object.values(data?.query?.pages || {});
        const images = pages.map(page => {
            const info = page?.imageinfo?.[0];
            const meta = info?.extmetadata || {};
            const imageUrl = info?.thumburl || info?.url || "";
            const pageUrl = info?.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent((page?.title || "").replace(/ /g, "_"))}`;
            if (!imageUrl.startsWith("https://upload.wikimedia.org/")) return null;
            const clean = value => String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
            return {
                title: clean(page?.title?.replace(/^File:/, "")) || "Imagem ilustrativa",
                imageUrl,
                pageUrl,
                artist: clean(meta.Artist?.value) || "Autor indicado na fonte",
                license: clean(meta.LicenseShortName?.value) || "Consulte a licença na fonte",
                licenseUrl: clean(meta.LicenseUrl?.value)
            };
        }).filter(Boolean).slice(0, 3);

        return json({ images });
    } catch (error) {
        console.error("Falha na busca de imagens ilustrativas:", error);
        return json({ images: [] });
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === "/api/chat") {
            return handleChat(request, env);
        }

        if (url.pathname === "/api/images") {
            return handleImageSearch(request);
        }

        if (url.pathname === "/api/health") {
            return json({
                ok: true,
                service: "CCSIA",
                aiConfigured: Boolean(env.GROQ_API_KEY)
            });
        }

        return env.ASSETS.fetch(request);
    }
};
