# CCSIA — Sabidinho CCS com pesquisa LangSearch

## O que foi atualizado

- Identidade do assistente: **Sabidinho CCS**, mantendo **CCSIA — Caixinha do Saber Inteligência Artificial** como nome oficial do projeto/tecnologia.
- A pesquisa web do endpoint `/api/chat` agora usa a **LangSearch Web Search API**.
- O Worker envia a consulta para a LangSearch, recebe resultados reais com títulos, URLs e trechos/texto de páginas e fornece esse contexto ao modelo de IA.
- As fontes são acrescentadas à resposta somente quando o modelo as cita com os marcadores correspondentes. URLs precisam ser HTTP ou HTTPS válidas.
- A pesquisa falha de forma explícita quando falta a chave, a API retorna erro ou não há resultados; o assistente não deve fingir que pesquisou.
- A chave fica no secret do Cloudflare Worker e não é colocada no frontend nem incluída neste ZIP.
- As respostas de data/hora continuam dinâmicas, com suporte a fuso horário do navegador e a cidades reconhecidas.
- O histórico em `localStorage`, a interface e o formato das conversas foram preservados; não há limpeza destrutiva do histórico.

## Arquivos modificados nesta atualização

- `cloudflare-worker/worker.js` — substituída a integração de pesquisa Brave por LangSearch e atualizado o estado de configuração em `/api/health`.
- `README_ATUALIZACAO.md` — documentação de configuração e testes.

Os arquivos de frontend e o restante da estrutura foram mantidos nesta atualização.

## Plano gratuito e limites

A LangSearch anuncia um plano de pesquisa por US$ 0, com uma **cota diária de tokens**, limites por minuto e até 50 resultados por requisição. A cota é compartilhada entre as chaves da mesma conta e reinicia às 00:00 UTC. Portanto, é gratuito dentro dos limites publicados, mas **não é ilimitado**. Os limites podem mudar; confira o painel da conta e a página oficial antes de usar em produção:

- Página oficial: https://langsearch.com/pricing
- Documentação/API: https://github.com/langsearch-ai/langsearch
- Painel para criar uma chave: https://langsearch.com/

## Configurar a chave no Cloudflare

1. Entre no site oficial da LangSearch e crie uma conta/chave de API.
2. No painel do Cloudflare, abra **Workers & Pages** e selecione o Worker `ccsia-2026`.
3. Acesse **Settings > Variables and Secrets** (o nome da seção pode variar conforme a interface).
4. Adicione `LANGSEARCH_API_KEY` como **Secret**. Cole a chave obtida na LangSearch; não a coloque no frontend, no GitHub ou neste README.
5. Preserve o secret `GROQ_API_KEY` existente, necessário para o modelo de IA.
6. Publique o Worker atualizado. Se usar Wrangler, a partir da raiz do repositório execute `npx wrangler deploy`, com Wrangler instalado/autenticado.
7. O frontend continua publicado separadamente no GitHub Pages/host já utilizado. Enviar o frontend ao GitHub não publica automaticamente o Worker.

## Como a integração funciona

- Endpoint: `POST https://api.langsearch.com/v1/web-search`
- Autenticação: `Authorization: Bearer <LANGSEARCH_API_KEY>`
- Corpo: consulta, seis resultados e conteúdo de página limitado a aproximadamente 1.800 caracteres por resultado para controlar o contexto enviado ao modelo.
- O Worker verifica o status HTTP e o campo `code` da resposta antes de usar os resultados.
- As fontes são filtradas para aceitar somente URLs `http://` ou `https://`.
- O conteúdo externo é tratado como dado não confiável, não como instruções para o modelo.
- A pesquisa é acionada quando a lógica de intenção existente identifica solicitação explícita de pesquisa ou necessidade de atualidade; perguntas simples e data/hora não precisam chamar a pesquisa.

## Como verificar após publicar

1. Pergunte ao Sabidinho CCS: `Pesquise na internet as últimas novidades sobre inteligência artificial`.
2. Confira se a resposta apresenta uma seção **Fontes consultadas** com links reais retornados pela API.
3. Pergunte algo simples, como `Explique o que é inteligência artificial`, e confirme que não precisa acionar pesquisa externa.
4. Pergunte `Que horas são?` para verificar a resposta temporal dinâmica.
5. Atualize a página e abra uma conversa antiga para verificar o histórico.
6. Para conferir a configuração, abra `/api/health` no domínio do Worker. `searchConfigured` deverá ser `true` depois que o secret for configurado e publicado.

## Testes realizados nesta entrega

- `node --check` no arquivo `cloudflare-worker/worker.js`.
- Inspeção estática confirmando o endpoint LangSearch, o cabeçalho Bearer, a validação da resposta e o tratamento de ausência de `LANGSEARCH_API_KEY`.
- Verificação do conteúdo do ZIP e dos arquivos necessários.

## Limitações conhecidas

- A pesquisa real depende de configurar `LANGSEARCH_API_KEY` no Cloudflare e publicar o Worker. A chave não está incluída no ZIP.
- A cota da LangSearch é diária e medida em tokens; os resultados de páginas mais longos consomem mais da cota. Não há garantia de disponibilidade ininterrupta.
- O modelo de IA também depende do secret `GROQ_API_KEY` e dos limites do provedor correspondente.
- Não foi possível executar uma pesquisa real autenticada nem verificar o site publicado, pois isso exige a chave privada da conta e acesso ao ambiente de publicação.
