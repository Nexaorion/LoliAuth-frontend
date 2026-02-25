import http from "@/lib/http";
import type { KycStartResponse, KycRecord, KycStatus } from "@/types";

export async function startKyc(): Promise<KycStartResponse> {
  const res = await http.post<KycStartResponse>("/api/v1/kyc/start");
  return res.data;
}

export async function verifyKyc(): Promise<KycRecord> {
  const res = await http.post<KycRecord>("/api/v1/kyc/verify");
  return res.data;
}

export async function queryKyc(verifyToken: string): Promise<KycRecord> {
  const res = await http.post<KycRecord>("/api/v1/kyc/query", {
    verify_token: verifyToken,
  });
  return res.data;
}

export async function getKycStatus(): Promise<KycStatus> {
  const res = await http.get<KycStatus>("/api/v1/kyc/status");
  return res.data;
}

export async function getKycRecords(): Promise<KycRecord[]> {
  const res = await http.get<KycRecord[]>("/api/v1/kyc/records");
  return res.data;
}
