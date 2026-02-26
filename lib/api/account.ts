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

export async function sendPasswordResetCode(): Promise<MessageResponse> {
  const res = await http.post<MessageResponse>(
    "/api/v1/account/password/send-code"
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

export async function sendOldEmailCode(): Promise<MessageResponse> {
  const res = await http.post<MessageResponse>(
    "/api/v1/account/email/send-old-code"
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
