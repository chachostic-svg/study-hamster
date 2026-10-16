import { googleClientId, verifyGoogleIdToken } from "./google.js";
import { dataKey, defaultState, loadState, STORAGE_KEY } from "./model.js";

export const ACCOUNTS_KEY = "study-hamster-accounts";
export const SESSION_KEY = "study-hamster-session";

const encoder = new TextEncoder();

function readAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function hasAccounts() {
  return readAccounts().length > 0;
}

export function currentUser() {
  const id = localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  const account = readAccounts().find((item) => item.id === id);
  if (!account) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  return publicUser(account);
}

function publicUser(account) {
  return {
    id: account.id,
    login: account.login,
    name: account.name,
    provider: account.hash ? "password" : "google",
  };
}

function cleanName(name, fallback) {
  const value = String(name || "").trim().slice(0, 24);
  if (value) return value;
  const spare = String(fallback || "").trim().slice(0, 24);
  return spare || "Ученик";
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function validEmail(email) {
  return email.length <= 80 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

async function digestPassword(password, salt) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encoder.encode(salt), iterations: 120000, hash: "SHA-256" },
    key,
    256,
  );
  return [...new Uint8Array(bits)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function initialState(name) {
  const legacy = localStorage.getItem(STORAGE_KEY);
  if (!legacy) return { ...defaultState(), name };
  localStorage.removeItem(STORAGE_KEY);
  try {
    const data = JSON.parse(legacy);
    if (data && Array.isArray(data.lessons) && Array.isArray(data.tasks)) {
      return { ...defaultState(), ...data, name: data.name || name };
    }
  } catch {
    /* битое старое сохранение не переносим */
  }
  return { ...defaultState(), name };
}

export async function register({ name, email, password, confirm }) {
  const cleanName = String(name || "").trim().slice(0, 24);
  const cleanEmail = String(email || "").trim();
  const loginKey = normalizeEmail(cleanEmail);
  if (!cleanName) throw new Error("auth.name");
  if (!validEmail(cleanEmail)) throw new Error("auth.email");
  if (String(password || "").length < 6) throw new Error("auth.password");
  if (password !== confirm) throw new Error("auth.confirm");
  const accounts = readAccounts();
  const existing = accounts.find((item) => item.loginKey === loginKey);
  if (existing?.hash) throw new Error("auth.exists");
  if (existing) throw new Error("auth.googleOnly");

  const account = {
    id: crypto.randomUUID(),
    login: cleanEmail,
    loginKey,
    name: cleanName,
    salt: crypto.randomUUID(),
    hash: "",
  };
  account.hash = await digestPassword(password, account.salt);
  writeAccounts([...accounts, account]);
  localStorage.setItem(dataKey(account.id), JSON.stringify(initialState(cleanName)));
  localStorage.setItem(SESSION_KEY, account.id);
  return publicUser(account);
}

export async function signIn({ email, password }) {
  const loginKey = normalizeEmail(email);
  const account = readAccounts().find((item) => item.loginKey === loginKey);
  if (account && !account.hash) throw new Error("auth.useGoogle");
  const hash = await digestPassword(password || "", account?.salt || "study-hamster");
  if (!account || hash !== account.hash) throw new Error("auth.badLogin");
  localStorage.setItem(SESSION_KEY, account.id);
  return publicUser(account);
}

export async function signInWithGoogle(credential) {
  const clientId = googleClientId();
  if (!clientId) throw new Error("auth.needClient");
  const profile = await verifyGoogleIdToken(credential, clientId);
  const cleanEmail = profile.email.trim();
  const loginKey = normalizeEmail(cleanEmail);
  if (!validEmail(cleanEmail)) throw new Error("auth.badGoogleEmail");

  const accounts = readAccounts();
  const bySub = accounts.find((item) => item.googleSub === profile.sub);
  const byEmail = accounts.find((item) => item.loginKey === loginKey);
  let account = bySub || byEmail;
  if (bySub && byEmail && bySub.id !== byEmail.id) throw new Error("auth.emailTaken");

  if (!account) {
    const name = cleanName(profile.name, loginKey.split("@")[0]);
    account = {
      id: crypto.randomUUID(),
      login: cleanEmail,
      loginKey,
      name,
      salt: "",
      hash: "",
      googleSub: profile.sub,
    };
    writeAccounts([...accounts, account]);
    localStorage.setItem(dataKey(account.id), JSON.stringify(initialState(name)));
  } else {
    const next = { ...account, login: cleanEmail, loginKey, googleSub: profile.sub };
    writeAccounts(accounts.map((item) => (item.id === account.id ? next : item)));
    account = next;
  }
  localStorage.setItem(SESSION_KEY, account.id);
  return publicUser(account);
}

export function renameAccount(id, name) {
  const clean = String(name || "").trim().slice(0, 24);
  writeAccounts(readAccounts().map((item) => (item.id === id ? { ...item, name: clean } : item)));
}

export function readThemeForSession() {
  const user = currentUser();
  if (!user) return "system";
  try {
    const saved = loadState(user.id);
    return saved.theme || "system";
  } catch {
    return "system";
  }
}
