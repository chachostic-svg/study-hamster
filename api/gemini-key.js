import { handleChatRequest } from "../server/plugin.js";

export default function handler(req, res) {
  req.url = "/api/gemini-key";
  return handleChatRequest(req, res);
}
