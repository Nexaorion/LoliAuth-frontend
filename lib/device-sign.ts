const DEVICE_TOKEN_KEY = "loliauth_device_token";
const DEVICE_PRIVATE_KEY_KEY = "loliauth_device_private_key";
const DEVICE_FINGERPRINT_KEY = "loliauth_device_fingerprint";

export function getDeviceToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DEVICE_TOKEN_KEY);
}

export function setDeviceToken(token: string): void {
  localStorage.setItem(DEVICE_TOKEN_KEY, token);
}

export function getDevicePrivateKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DEVICE_PRIVATE_KEY_KEY);
}

export function setDevicePrivateKey(key: string): void {
  localStorage.setItem(DEVICE_PRIVATE_KEY_KEY, key);
}

export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "";
  let fp = localStorage.getItem(DEVICE_FINGERPRINT_KEY);
  if (!fp) {
    fp = generateFingerprint();
    localStorage.setItem(DEVICE_FINGERPRINT_KEY, fp);
  }
  return fp;
}

export function getDeviceName(): string {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  if (/Windows/.test(ua)) return "Windows";
  if (/Macintosh|Mac OS/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  if (/iPhone|iPad/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  return "Unknown";
}

function generateFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth.toString(),
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || "unknown",
  ];
  let hash = 0;
  const str = components.join("|");
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return "fp_" + Math.abs(hash).toString(36) + Date.now().toString(36);
}

function generateNonce(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Bytes(data: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  return crypto.subtle.digest("SHA-256", encoder.encode(data));
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export interface DeviceSignatureHeaders {
  "X-Device-Token": string;
  "X-Device-Signature": string;
  "X-Timestamp": string;
  "X-Nonce": string;
  "X-Device-Fingerprint": string;
  "X-Device-Name": string;
}

export function isDeviceRegistered(): boolean {
  return !!getDeviceToken() && !!getDevicePrivateKey();
}

export async function generateSignatureHeaders(
  method: string,
  pathWithQuery: string,
  body: string = ""
): Promise<DeviceSignatureHeaders | null> {
  const deviceToken = getDeviceToken();
  const privateKeyPem = getDevicePrivateKey();

  if (!deviceToken || !privateKeyPem) {
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = generateNonce();
  const bodyHash = await sha256Hex(body);

  // Build Canonical String
  const canonical = [method.toUpperCase(), pathWithQuery, bodyHash, timestamp, nonce].join("\n");

  // SHA256 digest of canonical string
  const digestBuffer = await sha256Bytes(canonical);

  // Sign with Ed25519
  // Import the private key
  const privateKeyDer = pemToDer(privateKeyPem);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyDer,
    { name: "Ed25519" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("Ed25519", cryptoKey, digestBuffer);
  const signatureBase64Url = base64UrlEncode(signatureBuffer);

  return {
    "X-Device-Token": deviceToken,
    "X-Device-Signature": signatureBase64Url,
    "X-Timestamp": timestamp,
    "X-Nonce": nonce,
    "X-Device-Fingerprint": getDeviceFingerprint(),
    "X-Device-Name": getDeviceName(),
  };
}

function pemToDer(pem: string): ArrayBuffer {
  const lines = pem
    .replace(/-----BEGIN [A-Z ]+-----/, "")
    .replace(/-----END [A-Z ]+-----/, "")
    .replace(/\s/g, "");
  const binary = atob(lines);
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }
  return buffer;
}
