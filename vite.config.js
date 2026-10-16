import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { chatApi } from "./server/plugin.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  return {
    plugins: [react(), chatApi()],
  };
});
