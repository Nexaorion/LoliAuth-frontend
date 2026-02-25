import http from "@/lib/http";
import type {
  RegisterRequest,
  User,
  LoginRequest,
  LoginResponse,
  SendCodeRequest,
  SendCodeResponse,
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
