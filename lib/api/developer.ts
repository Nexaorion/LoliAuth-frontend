import http from "@/lib/http";
import type {
  OAuthClient,
  OAuthClientCreated,
  CreateClientRequest,
  UpdateClientRequest,
} from "@/types";

export async function getClients(): Promise<OAuthClient[]> {
  const res = await http.get<OAuthClient[]>("/api/v1/developer/clients");
  return res.data;
}

export async function createClient(
  data: CreateClientRequest
): Promise<OAuthClientCreated> {
  const res = await http.post<OAuthClientCreated>(
    "/api/v1/developer/clients",
    data
  );
  return res.data;
}

export async function deleteClient(clientId: string): Promise<void> {
  await http.delete(`/api/v1/developer/clients/${clientId}`);
}

export async function updateClient(
  clientId: string,
  data: UpdateClientRequest
): Promise<OAuthClient> {
  const res = await http.put<OAuthClient>(
    `/api/v1/developer/clients/${clientId}`,
    data
  );
  return res.data;
}
