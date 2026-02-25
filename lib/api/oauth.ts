import http from "@/lib/http";
import type {
  AuthorizeParams,
  AuthorizeResponse,
  ConsentRequest,
  AuthorizeRedirectResponse,
} from "@/types";

export async function authorize(
  params: AuthorizeParams
): Promise<AuthorizeResponse> {
  const res = await http.get<AuthorizeResponse>("/oauth/authorize", { params });
  return res.data;
}

export async function consent(
  data: ConsentRequest
): Promise<AuthorizeRedirectResponse> {
  const res = await http.post<AuthorizeRedirectResponse>(
    "/oauth/authorize/consent",
    data
  );
  return res.data;
}
