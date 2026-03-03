import http from "@/lib/http";
import type {
  RegisterRequest,
  User,
  LoginRequest,
  LoginResponse,
  SendCodeRequest,
  SendCodeResponse,
  PasswordResetRequest,
  ForgotPasswordRequest,
  ForgotPasswordVerifyRequest,
  ForgotPasswordVerifyResponse,
  ForgotPasswordResetRequest,
  SendNewEmailCodeRequest,
  ChangeEmailRequest,
  MessageResponse,
  Passkey,
  PasskeyCreated,
  RenamePasskeyRequest,
  UpdateProfileRequest,
} from "@/types";

export async function sendRegisterCode(
  data: SendCodeRequest
): Promise<SendCodeResponse> {
  const res = await http.post<SendCodeResponse>(
    "/api/v1/account/register/send-code",
    data
  );
  return res.data;
}

export async function register(data: RegisterRequest): Promise<User> {
  const res = await http.post<User>("/api/v1/account/register", data);
  return res.data;
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>("/api/v1/account/login", data);
  return res.data;
}

export async function getProfile(): Promise<User> {
  const res = await http.get<User>("/api/v1/account/profile");
  return res.data;
}

export async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  const res = await http.put<User>("/api/v1/account/profile", data);
  return res.data;
}

export async function sendPasswordResetCode(data?: { hcaptcha_token?: string }): Promise<MessageResponse> {
  const res = await http.post<MessageResponse>(
    "/api/v1/account/password/send-code",
    data || {}
  );
  return res.data;
}

export async function resetPassword(
  data: PasswordResetRequest
): Promise<MessageResponse> {
  const res = await http.post<MessageResponse>(
    "/api/v1/account/password/reset",
    data
  );
  return res.data;
}

export async function forgotPassword(
  data: ForgotPasswordRequest
): Promise<MessageResponse> {
  const res = await http.post<MessageResponse>(
    "/api/v1/account/forgot-password",
    data
  );
  return res.data;
}

export async function forgotPasswordVerify(
  data: ForgotPasswordVerifyRequest
): Promise<ForgotPasswordVerifyResponse> {
  const res = await http.post<ForgotPasswordVerifyResponse>(
    "/api/v1/account/forgot-password/verify",
    data
  );
  return res.data;
}

export async function forgotPasswordReset(
  data: ForgotPasswordResetRequest
): Promise<MessageResponse> {
  const res = await http.post<MessageResponse>(
    "/api/v1/account/forgot-password/reset",
    data
  );
  return res.data;
}

export async function sendOldEmailCode(data?: { hcaptcha_token?: string }): Promise<MessageResponse> {
  const res = await http.post<MessageResponse>(
    "/api/v1/account/email/send-old-code",
    data || {}
  );
  return res.data;
}

export async function sendNewEmailCode(
  data: SendNewEmailCodeRequest
): Promise<MessageResponse> {
  const res = await http.post<MessageResponse>(
    "/api/v1/account/email/send-new-code",
    data
  );
  return res.data;
}

export async function changeEmail(
  data: ChangeEmailRequest
): Promise<MessageResponse> {
  const res = await http.post<MessageResponse>(
    "/api/v1/account/email/change",
    data
  );
  return res.data;
}

export async function passkeyLoginBegin(): Promise<{ publicKey: PublicKeyCredentialRequestOptions }> {
  const res = await http.post<{ publicKey: PublicKeyCredentialRequestOptions }>(
    "/api/v1/account/passkey/login/begin"
  );
  return res.data;
}

export async function passkeyLoginFinish(
  challenge: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  credential: any
): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>(
    `/api/v1/account/passkey/login/finish`,
    credential,
    { params: { challenge } }
  );
  return res.data;
}

export async function passkeyRegisterBegin(): Promise<{ publicKey: PublicKeyCredentialCreationOptions }> {
  const res = await http.post<{ publicKey: PublicKeyCredentialCreationOptions }>(
    "/api/v1/account/passkey/register/begin"
  );
  return res.data;
}

export async function passkeyRegisterFinish(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  credential: any
): Promise<PasskeyCreated> {
  const res = await http.post<PasskeyCreated>(
    `/api/v1/account/passkey/register/finish`,
    credential,
    { params: { name } }
  );
  return res.data;
}

export async function getPasskeys(): Promise<Passkey[]> {
  const res = await http.get<Passkey[]>("/api/v1/account/passkey/list");
  return res.data;
}

export async function renamePasskey(
  passkeyId: string,
  data: RenamePasskeyRequest
): Promise<Passkey> {
  const res = await http.put<Passkey>(
    `/api/v1/account/passkey/${passkeyId}`,
    data
  );
  return res.data;
}

export async function deletePasskey(
  passkeyId: string
): Promise<MessageResponse> {
  const res = await http.delete<MessageResponse>(
    `/api/v1/account/passkey/${passkeyId}`
  );
  return res.data;
}
