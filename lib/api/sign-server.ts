import http from "@/lib/http";
import {
  generateEd25519KeyPair,
  getDeviceFingerprint,
  getDeviceName,
  setDeviceToken,
  setDevicePrivateKey,
  setDevicePublicKey,
  setDeviceId,
  getDeviceId,
  isDeviceRegistered,
  clearDeviceCredentials,
} from "@/lib/device-sign";

interface DeviceRegisterRequest {
  user_id: string;
  device_name: string;
  device_fingerprint: string;
  device_public_key: string;
  timestamp: number;
}

interface DeviceRegisterResponse {
  device_id: string;
  device_token: string;
  expires_at: number;
}

interface DeviceRevokeRequest {
  user_id: string;
  device_id: string;
}

export async function registerDevice(
  userId: string
): Promise<DeviceRegisterResponse> {
  // Generate Ed25519 key pair in browser
  const keyPair = await generateEd25519KeyPair();

  const body: DeviceRegisterRequest = {
    user_id: userId,
    device_name: getDeviceName(),
    device_fingerprint: getDeviceFingerprint(),
    device_public_key: keyPair.publicKeyBase64Url,
    timestamp: Math.floor(Date.now() / 1000),
  };

  const res = await http.post<DeviceRegisterResponse>(
    "/device/register",
    body
  );

  // Persist credentials to localStorage
  setDeviceToken(res.data.device_token);
  setDeviceId(res.data.device_id);
  setDevicePrivateKey(keyPair.privateKeyPem);
  setDevicePublicKey(keyPair.publicKeyBase64Url);

  return res.data;
}

export async function revokeDevice(userId: string): Promise<void> {
  const deviceId = getDeviceId();
  if (!deviceId) return;

  const body: DeviceRevokeRequest = {
    user_id: userId,
    device_id: deviceId,
  };

  try {
    await http.post("/device/revoke", body);
  } finally {
    clearDeviceCredentials();
  }
}

export async function ensureDeviceRegistered(
  userId: string
): Promise<boolean> {
  if (isDeviceRegistered()) {
    return true;
  }

  // Clear any stale partial credentials
  clearDeviceCredentials();

  await registerDevice(userId);
  return true;
}
