import { ChatError, geminiReady, publicError, sanitizeMessages, saveGeminiKey, streamReply } from "./gemini.js";

function readBody(req) {
  if (req.body != null && req.body !== "") {
    return Promise.resolve(typeof req.body === "string" ? req.body : JSON.stringify(req.body));
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 80_000) {
        reject(new ChatError("gemini.long", 413));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export async function handleChatRequest(req, res, next = () => {}) {
  const url = (req.url || "").split("?")[0];
  if (url === "/api/gemini-status" && req.method === "GET") {
    sendJson(res, 200, { ready: geminiReady() });
    return;
  }
  if (url === "/api/gemini-key" && req.method === "POST") {
    const body = JSON.parse((await readBody(req)) || "{}");
    saveGeminiKey(body.key);
    sendJson(res, 200, { ready: true });
    return;
  }
  if (url !== "/api/chat") {
    next();
    return;
  }
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "gemini.post" });
    return;
  }

  const body = JSON.parse((await readBody(req)) || "{}");
  const messages = sanitizeMessages(body.messages);
  if (!messages.length || messages.at(-1).role !== "user") {
    throw new ChatError("gemini.question");
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  await streamReply({
    messages,
    context: body.context,
    onText(text) {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    },
  });
  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
}

function mount(server) {
  server.middlewares.use((req, res, next) => {
    handleChatRequest(req, res, next).catch((error) => {
      const known = error instanceof ChatError || error instanceof SyntaxError;
      const message = error instanceof ChatError
        ? error.message
        : error instanceof SyntaxError
          ? "gemini.parse"
          : publicError(error);
      const status = error instanceof ChatError ? error.status : known ? 400 : 502;
      if (!res.headersSent) {
        sendJson(res, status, { error: message });
        return;
      }
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    });
  });
}

export function chatApi() {
  return {
    name: "study-hamster-chat",
    configureServer: mount,
    configurePreviewServer: mount,
  };
}
