const CLIENT_KEY = "study-hamster-google-client";
const listeners = new Set();
let scriptPromise = null;
let currentClientId = "";
let certPromise = null;

export function googleClientId() {
  try {
    const saved = localStorage.getItem(CLIENT_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {
    /* локальное хранилище может быть закрыто */
  }
  return String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
}

export function googleClientSource() {
  try {
    if (localStorage.getItem(CLIENT_KEY)) return "saved";
  } catch {
    /* ignore */
  }
  return import.meta.env.VITE_GOOGLE_CLIENT_ID ? "env" : "";
}

export function saveGoogleClientId(value) {
  const id = String(value || "").trim();
  if (/\s/.test(id) || id.length > 200 || !id.endsWith(".apps.googleusercontent.com")) {
    throw new Error("google.clientId");
  }
  localStorage.setItem(CLIENT_KEY, id);
  return id;
}

export function clearGoogleClientId() {
  localStorage.removeItem(CLIENT_KEY);
}

let scriptLang = "";

function loadGis(lang) {
  const hl = lang === "en" ? "en" : "ru";
  if (window.google?.accounts?.id && scriptLang === hl) return Promise.resolve();
  if (scriptLang !== hl) {
    scriptPromise = null;
    scriptLang = hl;
    currentClientId = "";
    document.querySelectorAll("script[data-study-gis]").forEach((node) => node.remove());
    try {
      delete window.google;
    } catch {
      window.google = undefined;
    }
  }
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://accounts.google.com/gsi/client?hl=${hl}`;
      script.async = true;
      script.dataset.studyGis = "1";
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("google.script"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

function ensureInit(clientId) {
  if (currentClientId === clientId) return;
  currentClientId = clientId;
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      [...listeners].forEach((listener) => listener(response));
    },
    auto_select: false,
    cancel_on_tap_outside: true,
  });
}

export function mountGoogleButton(element, clientId, onCredential, lang = "ru") {
  let active = true;
  const handler = (response) => {
    if (active && response?.credential) onCredential(response.credential);
  };
  const ready = loadGis(lang).then(() => {
    if (!active) return;
    ensureInit(clientId);
    listeners.add(handler);
    const width = Math.max(200, Math.min(400, Math.floor(element.clientWidth) || 320));
    const theme = document.documentElement.dataset.theme === "dark" ? "filled_black" : "outline";
    element.replaceChildren();
    window.google.accounts.id.renderButton(element, {
      type: "standard",
      theme,
      size: "large",
      text: "continue_with",
      shape: "pill",
      logo_alignment: "center",
      width,
    });
  });
  return {
    ready,
    cancel() {
      active = false;
      listeners.delete(handler);
    },
  };
}

function bytesFromBase64Url(part) {
  const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function jsonFromBase64Url(part) {
  return JSON.parse(new TextDecoder().decode(bytesFromBase64Url(part)));
}

function googleCerts() {
  if (!certPromise) {
    certPromise = fetch("https://www.googleapis.com/oauth2/v3/certs").then((response) => {
      if (!response.ok) throw new Error("google.check");
      return response.json();
    }).catch((error) => {
      certPromise = null;
      throw error;
    });
  }
  return certPromise;
}

export async function verifyGoogleIdToken(credential, clientId) {
  const parts = String(credential || "").split(".");
  if (parts.length !== 3) throw new Error("google.bad");
  let header;
  let payload;
  try {
    header = jsonFromBase64Url(parts[0]);
    payload = jsonFromBase64Url(parts[1]);
  } catch {
    throw new Error("google.bad");
  }
  const certs = await googleCerts().catch(() => {
    throw new Error("google.offline");
  });
  const jwk = certs.keys?.find((key) => key.kid === header.kid);
  if (!jwk) throw new Error("google.check");
  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: jwk.kty, n: jwk.n, e: jwk.e },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    bytesFromBase64Url(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  const issuerOk = payload.iss === "https://accounts.google.com" || payload.iss === "accounts.google.com";
  const audience = payload.aud === clientId;
  const fresh = Number(payload.exp) * 1000 > Date.now();
  if (!valid || !issuerOk || !audience || !fresh) throw new Error("google.verify");
  if (payload.email_verified !== true) throw new Error("google.unverified");
  if (!payload.email || !payload.sub) throw new Error("google.noEmail");
  return { email: String(payload.email), name: String(payload.name || ""), sub: String(payload.sub) };
}
