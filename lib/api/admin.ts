import http from "@/lib/http";
import type {
  AdminUser,
  AdminClient,
  AdminKycRecord,
  AuditLog,
  PaginatedResponse,
  UpdateUserRequest,
  UpdateClientStatusRequest,
  KycStatus,
  KycAttemptsResponse,
  AdminChangeEmailRequest,
  MessageResponse,
} from "@/types";

export async function getUsers(params?: {
  page?: number;
  page_size?: number;
  status?: string;
  email?: string;
  role?: string;
}): Promise<PaginatedResponse<AdminUser>> {
  const res = await http.get<PaginatedResponse<AdminUser>>(
    "/api/v1/admin/users",
    { params }
  );
  return res.data;
}

export async function getUser(userId: string): Promise<AdminUser> {
  const res = await http.get<AdminUser>(`/api/v1/admin/users/${userId}`);
  return res.data;
}

export async function updateUser(
  userId: string,
  data: UpdateUserRequest
): Promise<AdminUser> {
  const res = await http.put<AdminUser>(
    `/api/v1/admin/users/${userId}`,
    data
  );
  return res.data;
}

export async function deleteUser(
  userId: string
): Promise<{ message: string }> {
  const res = await http.delete<{ message: string }>(
    `/api/v1/admin/users/${userId}`
  );
  return res.data;
}

export async function adminChangeUserEmail(
  userId: string,
  data: AdminChangeEmailRequest
): Promise<AdminUser> {
  const res = await http.put<AdminUser>(
    `/api/v1/admin/users/${userId}/email`,
    data
  );
  return res.data;
}

export async function adminResetUserPassword(
  userId: string
): Promise<MessageResponse> {
  const res = await http.post<MessageResponse>(
    `/api/v1/admin/users/${userId}/reset-password`
  );
  return res.data;
}

export async function getAdminClients(params?: {
  page?: number;
  page_size?: number;
  status?: string;
  app_name?: string;
}): Promise<PaginatedResponse<AdminClient>> {
  const res = await http.get<PaginatedResponse<AdminClient>>(
    "/api/v1/admin/clients",
    { params }
  );
  return res.data;
}

export async function getAdminClient(
  clientId: string
): Promise<AdminClient> {
  const res = await http.get<AdminClient>(
    `/api/v1/admin/clients/${clientId}`
  );
  return res.data;
}

export async function updateClientStatus(
  clientId: string,
  data: UpdateClientStatusRequest
): Promise<AdminClient> {
  const res = await http.put<AdminClient>(
    `/api/v1/admin/clients/${clientId}/status`,
    data
  );
  return res.data;
}

export async function deleteAdminClient(
  clientId: string
): Promise<{ message: string }> {
  const res = await http.delete<{ message: string }>(
    `/api/v1/admin/clients/${clientId}`
  );
  return res.data;
}

export async function getAdminKycStatus(userId: string): Promise<KycStatus> {
  const res = await http.get<KycStatus>(`/api/v1/admin/kyc/${userId}`);
  return res.data;
}

export async function getAdminKycRecords(
  userId: string
): Promise<AdminKycRecord[]> {
  const res = await http.get<AdminKycRecord[]>(
    `/api/v1/admin/kyc/${userId}/records`
  );
  return res.data;
}

export async function adjustKycAttempts(
  userId: string,
  delta: number
): Promise<KycAttemptsResponse> {
  const res = await http.post<KycAttemptsResponse>(
    `/api/v1/admin/kyc/${userId}/attempts`,
    { delta }
  );
  return res.data;
}

export async function setKycAttempts(
  userId: string,
  attempts: number
): Promise<KycAttemptsResponse> {
  const res = await http.put<KycAttemptsResponse>(
    `/api/v1/admin/kyc/${userId}/attempts`,
    { attempts }
  );
  return res.data;
}

export async function resetKycStatus(
  userId: string
): Promise<{ message: string; user_id: string }> {
  const res = await http.post<{ message: string; user_id: string }>(
    `/api/v1/admin/kyc/${userId}/reset`
  );
  return res.data;
}

export async function getAuditLogs(params?: {
  page?: number;
  page_size?: number;
  user_id?: string;
  action?: string;
}): Promise<PaginatedResponse<AuditLog>> {
  const res = await http.get<PaginatedResponse<AuditLog>>(
    "/api/v1/admin/audit-logs",
    { params }
  );
  return res.data;
}

export async function exportAuditLogs(params?: {
  format?: "txt" | "text" | "markdown" | "md";
  user_id?: string;
  action?: string;
}): Promise<Blob> {
  const res = await http.get("/api/v1/admin/audit-logs/export", {
    params,
    responseType: "blob",
  });
  return res.data;
}
