import http from "@/lib/http";
import type { KycStartResponse, KycRecord, KycStatus } from "@/types";
import { generateSignatureHeaders, isDeviceRegistered } from "@/lib/device-sign";

async function withDeviceSign(
  method: string,
  path: string,
  body: string = ""
): Promise<Record<string, string>> {
  if (!isDeviceRegistered()) return {};
  const headers = await generateSignatureHeaders(method, path, body);
  return headers ? (headers as unknown as Record<string, string>) : {};
}

export async function startKyc(): Promise<KycStartResponse> {
  const path = "/api/v1/kyc/start";
  const headers = await withDeviceSign("POST", path);
  const res = await http.post<KycStartResponse>(path, undefined, { headers });
  return res.data;
}

export async function verifyKyc(): Promise<KycRecord> {
  const path = "/api/v1/kyc/verify";
  const headers = await withDeviceSign("POST", path);
  const res = await http.post<KycRecord>(path, undefined, { headers });
  return res.data;
}

export async function queryKyc(verifyToken: string): Promise<KycRecord> {
  const path = "/api/v1/kyc/query";
  const body = JSON.stringify({ verify_token: verifyToken });
  const headers = await withDeviceSign("POST", path, body);
  const res = await http.post<KycRecord>(path, { verify_token: verifyToken }, { headers });
  return res.data;
}

export async function getKycStatus(): Promise<KycStatus> {
  const path = "/api/v1/kyc/status";
  const headers = await withDeviceSign("GET", path);
  const res = await http.get<KycStatus>(path, { headers });
  return res.data;
}

export async function getKycRecords(): Promise<KycRecord[]> {
  const path = "/api/v1/kyc/records";
  const headers = await withDeviceSign("GET", path);
  const res = await http.get<KycRecord[]>(path, { headers });
  return res.data;
}
