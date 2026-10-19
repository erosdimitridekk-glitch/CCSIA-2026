import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const workerSource = (await readFile(new URL("../cloudflare-worker/worker.js", import.meta.url), "utf8"))
  .replace("export default {", "globalThis.worker = {");
const sandbox = { Response, Request, URL, URLSearchParams, AbortSignal, console, fetch: undefined };
vm.runInNewContext(workerSource, sandbox, { filename: "worker.js" });

function setup({ pages = [{ name: "Fonte recente", url: "https://example.org/recente", text: "Informação confirmada.", datePublished: "2026-10-18" }] } = {}) {
  const calls = [];
  sandbox.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init, body: init.body ? JSON.parse(init.body) : null });
    if (String(url).includes("langsearch")) {
      return new Response(JSON.stringify({ code: "200", data: { webPages: { value: pages } } }), { status: 200 });
    }
    return new Response(JSON.stringify({ choices: [{ message: { content: "Resposta baseada nas fontes [1]." } }] }), { status: 200 });
  };
  return calls;
}

async function chat(message, { history = [], imageData = "" } = {}) {
  const request = new Request("https://ccsia.test/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, imageData })
  });
  const response = await sandbox.worker.fetch(request, { GROQ_API_KEY: "test-groq", LANGSEARCH_API_KEY: "test-search" });
  return { response, data: await response.json() };
}

test("pergunta sobre o último jogo do Flamengo usa recência documentada", async () => {
  const calls = setup();
  await chat("Qual foi o último jogo do Flamengo?");
  assert.equal(calls[0].body.freshness, "oneMonth");
});

test("resultados recentes do Flamengo também pedem janela recente", async () => {
  const calls = setup();
  await chat("Quais foram os resultados mais recentes do Flamengo?");
  assert.equal(calls[0].body.freshness, "oneMonth");
});

test("pergunta de acompanhamento incorpora o contexto da conversa", async () => {
  const calls = setup();
  await chat("Quem marcou os gols na última partida?", { history: [{ role: "user", content: "Qual foi o último jogo do Flamengo?" }] });
  assert.match(calls[0].body.query, /Flamengo/);
});

test("notícias recentes sobre IA aplicam freshness", async () => {
  const calls = setup();
  await chat("Quais são as notícias mais recentes sobre inteligência artificial?");
  assert.equal(calls[0].body.freshness, "oneMonth");
});

test("consulta sobre ontem no futebol usa recência", async () => {
  const calls = setup();
  await chat("O que aconteceu ontem no futebol brasileiro?");
  assert.equal(calls[0].body.freshness, "oneMonth");
});

test("assunto atual não cadastrado continua pesquisável", async () => {
  const calls = setup();
  await chat("Qual é o estado atual do projeto astronômico Kestrel-9?");
  assert.equal(calls[0].url.includes("langsearch"), true);
});

test("definição estável pode responder sem pesquisa", async () => {
  const calls = setup();
  await chat("Explique o que é fotossíntese.");
  assert.equal(calls.some(call => call.url.includes("langsearch")), false);
  assert.equal(calls.some(call => call.url.includes("groq")), true);
});

test("resposta vazia do mecanismo é tratada sem chamar a Groq", async () => {
  const calls = setup({ pages: [] });
  const { response, data } = await chat("O que aconteceu hoje no esporte?");
  assert.equal(response.status, 502);
  assert.equal(data.searched, true);
  assert.equal(calls.filter(call => call.url.includes("langsearch")).length, 2);
  assert.equal(calls[0].body.freshness, "oneMonth");
  assert.equal("freshness" in calls[1].body, false);
  assert.equal(calls.some(call => call.url.includes("groq")), false);
});

test("foto usa modelo multimodal e envia orientação de análise de imagem", async () => {
  const calls = setup();
  const photo = `data:image/jpeg;base64,${Buffer.from("imagem").toString("base64")}`;
  await chat("O que aparece nesta foto?", { imageData: photo });
  const groq = calls.find(call => call.url.includes("groq"));
  assert.equal(groq.body.model, "qwen/qwen3.6-27b");
  assert.match(groq.body.messages[0].content, /ANÁLISE DE IMAGEM/);
  assert.deepEqual(groq.body.messages.at(-1).content[1], { type: "image_url", image_url: { url: photo } });
});
