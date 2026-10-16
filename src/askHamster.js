export async function askHamster(messages, context, onText) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, context }),
  });
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/event-stream")) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "gemini.answer");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";
    for (const part of parts) {
      const line = part.split("\n").find((item) => item.startsWith("data: "));
      if (!line) continue;
      const payload = JSON.parse(line.slice(6));
      if (payload.error) throw new Error(payload.error);
      if (payload.text) {
        full += payload.text;
        onText(full);
      }
    }
  }
  return full.trim();
}

export async function geminiStatus() {
  const response = await fetch("/api/gemini-status");
  if (!response.ok) return false;
  const data = await response.json().catch(() => ({}));
  return Boolean(data.ready);
}

export async function saveGeminiKey(key) {
  const response = await fetch("/api/gemini-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "gemini.save");
}
