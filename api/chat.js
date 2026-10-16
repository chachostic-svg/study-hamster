import { handleChatRequest } from "../server/plugin.js";

export const maxDuration = 60;

export default function handler(req, res) {
  req.url = "/api/chat";
  return handleChatRequest(req, res);
}
