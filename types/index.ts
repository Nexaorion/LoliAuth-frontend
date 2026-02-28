export interface ApiError {
  error: string;
  error_description: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface User {
  id: string;
  email: string;
  status: "active" | "disabled" | "suspended";
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  verify_code: string;
}

export interface SendCodeRequest {
  email: string;
}

export interface SendCodeResponse {
  message: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
}

export interface OAuthClient {
  client_id: string;
  app_name: string;
  redirect_uris: string[];
  is_confidential: boolean;
}

export interface OAuthClientCreated extends OAuthClient {
  client_secret: string;
}

export interface CreateClientRequest {
  app_name: string;
  redirect_uris: string[];
  allowed_scopes?: string[];
  allowed_grant_types?: string[];
  is_confidential?: boolean;
}

export interface AuthorizeParams {
  response_type: "code";
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state: string;
  code_challenge: string;
  code_challenge_method: "S256";
}

export interface AuthorizeRedirectResponse {
  redirect_uri: string;
}

export interface AuthorizeConsentResponse {
  consent_required: true;
  client_name: string;
  scopes: string[];
  state: string;
}

export type AuthorizeResponse =
  | AuthorizeRedirectResponse
  | AuthorizeConsentResponse;

export interface ConsentRequest {
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state: string;
  code_challenge: string;
  code_challenge_method: "S256";
  approved: boolean;
}

export interface KycStartResponse {
  verify_token: string;
  h5_url: string;
}

export type KycFailCategory =
  | "liveness_failed"
  | "face_quality_issue"
  | "face_occlusion"
  | "id_mismatch"
  | "environment_issue"
  | "user_action_required"
  | "timeout"
  | "security_risk"
  | "token_invalid"
  | "rate_limit"
  | "video_issue"
  | "param_error"
  | "not_started"
  | "processing"
  | "not_completed"
  | "result_expired"
  | "service_error";

export interface KycRecord {
  id: string;
  status: "pending" | "success" | "failed" | "expired";
  id_name?: string;
  id_number?: string;
  score?: number;
  liveness_score?: number;
  spoofing_score?: number;
  fail_reason?: string;
  fail_category?: KycFailCategory;
  baidu_error_code?: number;
  created_at: string;
  updated_at: string;
}

export interface KycStatus {
  status: "none" | "pending" | "success" | "failed" | "expired";
  id_name?: string;
  id_number?: string;
  score?: number;
  liveness_score?: number;
  attempts_remaining: number;
  verified_at?: string;
  fail_reason?: string;
  fail_category?: KycFailCategory;
  baidu_error_code?: number;
}

export interface AdminUser {
  id: string;
  email: string;
  status: "active" | "disabled" | "suspended";
  role: "user" | "admin";
  kyc_attempts_remaining: number;
  created_at: string;
  updated_at: string;
}

export interface AdminKycRecord extends KycRecord {
  birthday?: string;
  gender?: string;
  nation?: string;
  address?: string;
  id_card_expire_time?: string;
  issue_authority?: string;
  id_card_issue_time?: string;
  id_card_front_image?: string;
  id_card_back_image?: string;
}

export interface AdminClient {
  id: string;
  client_id: string;
  app_name: string;
  redirect_uris: string[];
  allowed_scopes: string[];
  allowed_grant_types: string[];
  is_confidential: boolean;
  status: "pending" | "active" | "rejected" | "suspended";
  owner_id: string;
  created_at: string;
  reviewed_at: string | null;
}

export interface IpInfo {
  country_code: string;
  country_name: string;
  region_name: string;
  city_name: string;
  latitude: number;
  longitude: number;
  time_zone: string;
  asn: string;
  as: string;
  isp: string;
  usage_type: string;
  is_proxy: boolean;
  fraud_score: number;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  ip_address: string;
  device_fingerprint: string;
  device_name: string;
  ip_info: IpInfo | null;
  response_body?: string | null;
  created_at: string;
}

export interface PasswordResetRequest {
  verify_code: string;
  new_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordVerifyRequest {
  token: string;
}

export interface ForgotPasswordVerifyResponse {
  valid: boolean;
}

export interface ForgotPasswordResetRequest {
  token: string;
  new_password: string;
}

export interface SendNewEmailCodeRequest {
  old_code: string;
  new_email: string;
}

export interface ChangeEmailRequest {
  new_email: string;
  new_code: string;
}

export interface MessageResponse {
  message: string;
}

export interface UpdateUserRequest {
  status?: "active" | "disabled" | "suspended";
  role?: "user" | "admin";
}

export interface UpdateClientStatusRequest {
  status: "pending" | "active" | "rejected" | "suspended";
}

export interface KycAttemptsResponse {
  user_id: string;
  delta?: number;
  attempts_remaining: number;
}

export interface Passkey {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

export interface PasskeyCreated {
  id: string;
  name: string;
  created_at: string;
}

export interface RenamePasskeyRequest {
  name: string;
}

export interface AdminChangeEmailRequest {
  new_email: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  activated: boolean;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type:
    | "deposit"
    | "withdrawal"
    | "payment_sent"
    | "payment_received"
    | "subscription_charge"
    | "refund";
  amount: number;
  balance: number;
  reference_type?: string;
  reference_id?: string;
  description: string;
  created_at: string;
}

export interface DepositRequest {
  amount: number;
}

export interface DepositResponse {
  message: string;
  transaction: WalletTransaction;
}

export interface WithdrawRequest {
  amount: number;
  address: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  wallet_id: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  address: string;
  reviewed_by?: string;
  reviewed_at?: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "cancelled"
  | "refunded"
  | "expired";

export interface Order {
  id: string;
  developer_id: string;
  client_id: string;
  payer_id?: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  title: string;
  description?: string;
  metadata?: string;
  expires_at?: string;
  paid_at?: string;
  refunded_at?: string;
  refund_reason?: string;
  refunded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderRequest {
  client_id: string;
  amount: number;
  title: string;
  payer_id?: string;
  currency?: string;
  description?: string;
  metadata?: string;
  expires_in?: number;
}

export interface UpdateOrderRequest {
  payer_id?: string;
  amount?: number;
  title?: string;
  description?: string;
  metadata?: string;
}

export interface OrderStatusResponse {
  order_id: string;
  status: OrderStatus;
  paid_at?: string;
}

export interface RefundRequest {
  reason?: string;
}

export interface DashboardStats {
  total_orders: number;
  paid_orders: number;
  total_revenue: number;
  success_rate: number;
}

export interface DashboardResponse {
  days: number;
  stats: DashboardStats;
}

export interface SubscriptionPlan {
  id: string;
  developer_id: string;
  client_id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  interval_days: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanRequest {
  client_id: string;
  name: string;
  amount: number;
  interval_days: number;
  description?: string;
  currency?: string;
}

export interface UpdatePlanRequest {
  name?: string;
  description?: string;
  amount?: number;
  interval_days?: number;
  active?: boolean;
}

export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "expired"
  | "past_due";

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}
