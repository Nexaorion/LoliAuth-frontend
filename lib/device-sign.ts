const DEVICE_FINGERPRINT_KEY = "loliauth_device_fingerprint";

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
  let h1 = 0x811c9dc5;
  let h2 = 0xdeadbeef;
  const str = components.join("|");
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    h1 = (Math.imul(h1 ^ char, 0x01000193)) >>> 0;
    h2 = (Math.imul(h2 ^ char, 0x811c9dc5)) >>> 0;
  }
  return "fp_" + h1.toString(36) + h2.toString(36);
}