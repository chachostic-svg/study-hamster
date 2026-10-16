import { handleChatRequest } from "../server/plugin.js";

export default function handler(req, res) {
  req.url = "/api/gemini-status";
  return handleChatRequest(req, res);
}
