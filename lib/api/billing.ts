import http from "@/lib/http";
import type {
  Wallet,
  WalletTransaction,
  DepositRequest,
  DepositResponse,
  WithdrawRequest,
  Withdrawal,
  Order,
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderStatusResponse,
  RefundRequest,
  DashboardResponse,
  SubscriptionPlan,
  CreatePlanRequest,
  UpdatePlanRequest,
  Subscription,
  PaginatedResponse,
  MessageResponse,
} from "@/types";

export async function activateWallet(): Promise<Wallet> {
  const res = await http.post<Wallet>("/api/v1/billing/wallet/activate");
  return res.data;
}

export async function deactivateWallet(): Promise<{ message: string; wallet: Wallet }> {
  const res = await http.post<{ message: string; wallet: Wallet }>(
    "/api/v1/billing/wallet/deactivate"
  );
  return res.data;
}

export async function getWallet(): Promise<Wallet> {
  const res = await http.get<Wallet>("/api/v1/billing/wallet");
  return res.data;
}

export async function deposit(data: DepositRequest): Promise<DepositResponse> {
  const res = await http.post<DepositResponse>(
    "/api/v1/billing/wallet/deposit",
    data
  );
  return res.data;
}

export async function withdraw(data: WithdrawRequest): Promise<Withdrawal> {
  const res = await http.post<Withdrawal>(
    "/api/v1/billing/wallet/withdraw",
    data
  );
  return res.data;
}

export async function getWithdrawals(params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Withdrawal>> {
  const res = await http.get<PaginatedResponse<Withdrawal>>(
    "/api/v1/billing/wallet/withdrawals",
    { params }
  );
  return res.data;
}

export async function getWithdrawalDetail(id: string): Promise<Withdrawal> {
  const res = await http.get<Withdrawal>(
    `/api/v1/billing/wallet/withdrawals/${id}`
  );
  return res.data;
}

export async function getTransactions(params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<WalletTransaction>> {
  const res = await http.get<PaginatedResponse<WalletTransaction>>(
    "/api/v1/billing/wallet/transactions",
    { params }
  );
  return res.data;
}

export async function getMyOrders(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}): Promise<PaginatedResponse<Order>> {
  const res = await http.get<PaginatedResponse<Order>>(
    "/api/v1/billing/orders",
    { params }
  );
  return res.data;
}

export async function getOrderDetail(orderId: string): Promise<Order> {
  const res = await http.get<Order>(`/api/v1/billing/orders/${orderId}`);
  return res.data;
}

export async function payOrder(orderId: string): Promise<Order> {
  const res = await http.post<Order>(
    `/api/v1/billing/orders/${orderId}/pay`
  );
  return res.data;
}

export async function getMySubscriptions(params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Subscription>> {
  const res = await http.get<PaginatedResponse<Subscription>>(
    "/api/v1/billing/subscriptions",
    { params }
  );
  return res.data;
}

export async function subscribePlan(planId: string): Promise<Subscription> {
  const res = await http.post<Subscription>(
    `/api/v1/billing/subscriptions/${planId}/subscribe`
  );
  return res.data;
}

export async function cancelSubscription(
  subscriptionId: string
): Promise<Subscription> {
  const res = await http.post<Subscription>(
    `/api/v1/billing/subscriptions/${subscriptionId}/cancel`
  );
  return res.data;
}

export async function createOrder(
  data: CreateOrderRequest
): Promise<Order> {
  const res = await http.post<Order>(
    "/api/v1/developer/billing/orders",
    data
  );
  return res.data;
}

export async function getDeveloperOrders(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}): Promise<PaginatedResponse<Order>> {
  const res = await http.get<PaginatedResponse<Order>>(
    "/api/v1/developer/billing/orders",
    { params }
  );
  return res.data;
}

export async function updateOrder(
  orderId: string,
  data: UpdateOrderRequest
): Promise<Order> {
  const res = await http.put<Order>(
    `/api/v1/developer/billing/orders/${orderId}`,
    data
  );
  return res.data;
}

export async function deleteOrder(orderId: string): Promise<MessageResponse> {
  const res = await http.delete<MessageResponse>(
    `/api/v1/developer/billing/orders/${orderId}`
  );
  return res.data;
}

export async function getOrderStatus(
  orderId: string
): Promise<OrderStatusResponse> {
  const res = await http.get<OrderStatusResponse>(
    `/api/v1/developer/billing/orders/${orderId}/status`
  );
  return res.data;
}

export async function refundOrder(
  orderId: string,
  data?: RefundRequest
): Promise<Order> {
  const res = await http.post<Order>(
    `/api/v1/developer/billing/orders/${orderId}/refund`,
    data
  );
  return res.data;
}

export async function getDeveloperDashboard(params?: {
  days?: number;
}): Promise<DashboardResponse> {
  const res = await http.get<DashboardResponse>(
    "/api/v1/developer/billing/dashboard",
    { params }
  );
  return res.data;
}

export async function createPlan(
  data: CreatePlanRequest
): Promise<SubscriptionPlan> {
  const res = await http.post<SubscriptionPlan>(
    "/api/v1/developer/billing/plans",
    data
  );
  return res.data;
}

export async function getDeveloperPlans(params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<SubscriptionPlan>> {
  const res = await http.get<PaginatedResponse<SubscriptionPlan>>(
    "/api/v1/developer/billing/plans",
    { params }
  );
  return res.data;
}

export async function updatePlan(
  planId: string,
  data: UpdatePlanRequest
): Promise<SubscriptionPlan> {
  const res = await http.put<SubscriptionPlan>(
    `/api/v1/developer/billing/plans/${planId}`,
    data
  );
  return res.data;
}

export async function deletePlan(
  planId: string
): Promise<MessageResponse> {
  const res = await http.delete<MessageResponse>(
    `/api/v1/developer/billing/plans/${planId}`
  );
  return res.data;
}

export async function getAdminOrders(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}): Promise<PaginatedResponse<Order>> {
  const res = await http.get<PaginatedResponse<Order>>(
    "/api/v1/admin/orders",
    { params }
  );
  return res.data;
}

export async function getAdminOrderDetail(
  orderId: string
): Promise<Order> {
  const res = await http.get<Order>(`/api/v1/admin/orders/${orderId}`);
  return res.data;
}

export async function adminRefundOrder(
  orderId: string,
  data?: RefundRequest
): Promise<Order> {
  const res = await http.post<Order>(
    `/api/v1/admin/orders/${orderId}/refund`,
    data
  );
  return res.data;
}

export async function getAdminDashboard(params?: {
  days?: number;
}): Promise<DashboardResponse> {
  const res = await http.get<DashboardResponse>("/api/v1/admin/dashboard", {
    params,
  });
  return res.data;
}

export async function getAdminWithdrawals(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}): Promise<PaginatedResponse<Withdrawal>> {
  const res = await http.get<PaginatedResponse<Withdrawal>>(
    "/api/v1/admin/withdrawals",
    { params }
  );
  return res.data;
}

export async function getAdminWithdrawalDetail(
  id: string
): Promise<Withdrawal> {
  const res = await http.get<Withdrawal>(`/api/v1/admin/withdrawals/${id}`);
  return res.data;
}

export async function approveWithdrawal(id: string): Promise<Withdrawal> {
  const res = await http.put<Withdrawal>(
    `/api/v1/admin/withdrawals/${id}/approve`
  );
  return res.data;
}

export async function rejectWithdrawal(
  id: string,
  note?: string
): Promise<Withdrawal> {
  const res = await http.put<Withdrawal>(
    `/api/v1/admin/withdrawals/${id}/reject`,
    { note }
  );
  return res.data;
}
