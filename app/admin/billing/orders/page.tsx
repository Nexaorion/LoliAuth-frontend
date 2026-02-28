"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Typography,
  App,
  Tag,
  Select,
  Space,
  Modal,
  Form,
  Input,
  Tooltip,
  Card,
  Statistic,
  Row,
  Col,
  Segmented,
  Spin,
  Tabs,
  Popconfirm,
} from "antd";
import {
  EyeOutlined,
  RollbackOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  PercentageOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  getAdminOrders,
  adminRefundOrder,
  getAdminDashboard,
  getAdminWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
} from "@/lib/api/billing";
import type { Order, DashboardResponse, Withdrawal } from "@/types";

const { Title } = Typography;

const statusColorMap: Record<string, string> = {
  pending: "processing",
  paid: "success",
  cancelled: "default",
  refunded: "warning",
  expired: "error",
};

const statusLabelMap: Record<string, string> = {
  pending: "待支付",
  paid: "已支付",
  cancelled: "已取消",
  refunded: "已退款",
  expired: "已过期",
};

const withdrawalStatusMap: Record<string, { color: string; label: string }> = {
  pending: { color: "processing", label: "待审核" },
  approved: { color: "success", label: "已批准" },
  rejected: { color: "error", label: "已拒绝" },
};

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminOrdersPage() {
  const { message } = App.useApp();

  // Dashboard
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [days, setDays] = useState<number>(7);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(20);
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refundForm] = Form.useForm();

  // Withdrawals
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);
  const [withdrawalTotal, setWithdrawalTotal] = useState(0);
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [withdrawalPageSize, setWithdrawalPageSize] = useState(20);
  const [withdrawalStatus, setWithdrawalStatus] = useState<string>("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<Withdrawal | null>(null);
  const [rejectForm] = Form.useForm();

  const fetchDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const res = await getAdminDashboard({ days });
      setDashboard(res);
    } catch {
      message.error("加载看板数据失败");
    } finally {
      setDashboardLoading(false);
    }
  }, [days, message]);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await getAdminOrders({
        page: orderPage,
        page_size: orderPageSize,
        status: orderStatus || undefined,
      });
      setOrders(res.data);
      setOrderTotal(res.total);
    } catch {
      message.error("加载订单列表失败");
    } finally {
      setOrdersLoading(false);
    }
  }, [orderPage, orderPageSize, orderStatus, message]);

  const fetchWithdrawals = useCallback(async () => {
    setWithdrawalsLoading(true);
    try {
      const res = await getAdminWithdrawals({
        page: withdrawalPage,
        page_size: withdrawalPageSize,
        status: withdrawalStatus || undefined,
      });
      setWithdrawals(res.data);
      setWithdrawalTotal(res.total);
    } catch {
      message.error("加载提现列表失败");
    } finally {
      setWithdrawalsLoading(false);
    }
  }, [withdrawalPage, withdrawalPageSize, withdrawalStatus, message]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleRefund = async (values: { reason?: string }) => {
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      await adminRefundOrder(selectedOrder.id, values);
      message.success("退款成功");
      setRefundOpen(false);
      refundForm.resetFields();
      fetchOrders();
      fetchDashboard();
    } catch {
      message.error("退款失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveWithdrawal = async (id: string) => {
    try {
      await approveWithdrawal(id);
      message.success("提现已批准");
      fetchWithdrawals();
    } catch {
      message.error("操作失败");
    }
  };

  const handleRejectWithdrawal = async (values: { note?: string }) => {
    if (!selectedWithdrawal) return;
    setSubmitting(true);
    try {
      await rejectWithdrawal(selectedWithdrawal.id, values.note);
      message.success("提现已拒绝");
      setRejectOpen(false);
      rejectForm.resetFields();
      fetchWithdrawals();
    } catch {
      message.error("操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  const orderColumns: ColumnsType<Order> = [
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "金额",
      dataIndex: "amount",
      key: "amount",
      width: 100,
      render: (v: number) => formatCents(v),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (s: string) => (
        <Tag color={statusColorMap[s]}>{statusLabelMap[s] ?? s}</Tag>
      ),
    },
    {
      title: "开发者 ID",
      dataIndex: "developer_id",
      key: "developer_id",
      width: 140,
      ellipsis: true,
    },
    {
      title: "付款方 ID",
      dataIndex: "payer_id",
      key: "payer_id",
      width: 140,
      ellipsis: true,
      render: (v: string) => v || "-",
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedOrder(record);
                setDetailOpen(true);
              }}
            />
          </Tooltip>
          {record.status === "paid" && (
            <Tooltip title="退款">
              <Button
                type="text"
                size="small"
                icon={<RollbackOutlined />}
                onClick={() => {
                  setSelectedOrder(record);
                  setRefundOpen(true);
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const withdrawalColumns: ColumnsType<Withdrawal> = [
    {
      title: "用户 ID",
      dataIndex: "user_id",
      key: "user_id",
      width: 160,
      ellipsis: true,
    },
    {
      title: "金额",
      dataIndex: "amount",
      key: "amount",
      width: 100,
      render: (v: number) => formatCents(v),
    },
    {
      title: "提现地址",
      dataIndex: "address",
      key: "address",
      ellipsis: true,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (s: string) => {
        const info = withdrawalStatusMap[s] || {
          color: "default",
          label: s,
        };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: "申请时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "action",
      width: 140,
      render: (_, record) =>
        record.status === "pending" ? (
          <Space size="small">
            <Popconfirm
              title="确认批准此提现？"
              onConfirm={() => handleApproveWithdrawal(record.id)}
            >
              <Button type="text" size="small" icon={<CheckOutlined />}>
                批准
              </Button>
            </Popconfirm>
            <Button
              type="text"
              danger
              size="small"
              icon={<CloseOutlined />}
              onClick={() => {
                setSelectedWithdrawal(record);
                setRejectOpen(true);
              }}
            >
              拒绝
            </Button>
          </Space>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <AdminLayout>
      <Title level={3}>订单管理</Title>

      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 12,
          }}
        >
          <Segmented
            options={[
              { label: "近 7 天", value: 7 },
              { label: "近 14 天", value: 14 },
              { label: "近 31 天", value: 31 },
            ]}
            value={days}
            onChange={(v) => setDays(v as number)}
          />
        </div>
        {dashboardLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin />
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small">
                <Statistic
                  title="订单总数"
                  value={dashboard?.stats.total_orders ?? 0}
                  prefix={<ShoppingCartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small">
                <Statistic
                  title="已支付"
                  value={dashboard?.stats.paid_orders ?? 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small">
                <Statistic
                  title="总收入"
                  value={formatCents(dashboard?.stats.total_revenue ?? 0)}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: "#1677ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small">
                <Statistic
                  title="成功率"
                  value={(
                    (dashboard?.stats.success_rate ?? 0) * 100
                  ).toFixed(1)}
                  suffix="%"
                  prefix={<PercentageOutlined />}
                />
              </Card>
            </Col>
          </Row>
        )}
      </div>

      <Tabs
        items={[
          {
            key: "orders",
            label: "订单列表",
            children: (
              <>
                <div
                  style={{
                    marginBottom: 16,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Select
                    style={{ width: 130 }}
                    value={orderStatus}
                    onChange={setOrderStatus}
                    options={[
                      { value: "", label: "全部状态" },
                      { value: "pending", label: "待支付" },
                      { value: "paid", label: "已支付" },
                      { value: "cancelled", label: "已取消" },
                      { value: "refunded", label: "已退款" },
                      { value: "expired", label: "已过期" },
                    ]}
                  />
                </div>
                <Table
                  columns={orderColumns}
                  dataSource={orders}
                  rowKey="id"
                  loading={ordersLoading}
                  pagination={{
                    current: orderPage,
                    pageSize: orderPageSize,
                    total: orderTotal,
                    showSizeChanger: true,
                    onChange: (p, ps) => {
                      setOrderPage(p);
                      setOrderPageSize(ps);
                    },
                  }}
                />
              </>
            ),
          },
          {
            key: "withdrawals",
            label: "提现审核",
            children: (
              <>
                <div
                  style={{
                    marginBottom: 16,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Select
                    style={{ width: 130 }}
                    value={withdrawalStatus}
                    onChange={setWithdrawalStatus}
                    options={[
                      { value: "", label: "全部状态" },
                      { value: "pending", label: "待审核" },
                      { value: "approved", label: "已批准" },
                      { value: "rejected", label: "已拒绝" },
                    ]}
                  />
                </div>
                <Table
                  columns={withdrawalColumns}
                  dataSource={withdrawals}
                  rowKey="id"
                  loading={withdrawalsLoading}
                  pagination={{
                    current: withdrawalPage,
                    pageSize: withdrawalPageSize,
                    total: withdrawalTotal,
                    showSizeChanger: true,
                    onChange: (p, ps) => {
                      setWithdrawalPage(p);
                      setWithdrawalPageSize(ps);
                    },
                  }}
                />
              </>
            ),
          },
        ]}
      />

      <Modal
        title="订单详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={<Button onClick={() => setDetailOpen(false)}>关闭</Button>}
      >
        {selectedOrder && (
          <div style={{ lineHeight: 2 }}>
            <p>
              <strong>订单 ID：</strong>
              {selectedOrder.id}
            </p>
            <p>
              <strong>标题：</strong>
              {selectedOrder.title}
            </p>
            <p>
              <strong>金额：</strong>
              {formatCents(selectedOrder.amount)}
            </p>
            <p>
              <strong>状态：</strong>
              <Tag color={statusColorMap[selectedOrder.status]}>
                {statusLabelMap[selectedOrder.status]}
              </Tag>
            </p>
            <p>
              <strong>应用 ID：</strong>
              {selectedOrder.client_id}
            </p>
            <p>
              <strong>开发者 ID：</strong>
              {selectedOrder.developer_id}
            </p>
            <p>
              <strong>付款方 ID：</strong>
              {selectedOrder.payer_id || "-"}
            </p>
            {selectedOrder.description && (
              <p>
                <strong>描述：</strong>
                {selectedOrder.description}
              </p>
            )}
            {selectedOrder.paid_at && (
              <p>
                <strong>支付时间：</strong>
                {new Date(selectedOrder.paid_at).toLocaleString("zh-CN")}
              </p>
            )}
            {selectedOrder.refunded_at && (
              <p>
                <strong>退款时间：</strong>
                {new Date(selectedOrder.refunded_at).toLocaleString("zh-CN")}
              </p>
            )}
            {selectedOrder.refund_reason && (
              <p>
                <strong>退款原因：</strong>
                {selectedOrder.refund_reason}
              </p>
            )}
            {selectedOrder.expires_at && (
              <p>
                <strong>过期时间：</strong>
                {new Date(selectedOrder.expires_at).toLocaleString("zh-CN")}
              </p>
            )}
            <p>
              <strong>创建时间：</strong>
              {new Date(selectedOrder.created_at).toLocaleString("zh-CN")}
            </p>
          </div>
        )}
      </Modal>

      <Modal
        title="退款"
        open={refundOpen}
        onCancel={() => {
          setRefundOpen(false);
          refundForm.resetFields();
        }}
        footer={null}
      >
        <p>
          确认对订单 <strong>{selectedOrder?.title}</strong> 退款{" "}
          <strong>{formatCents(selectedOrder?.amount ?? 0)}</strong>？
        </p>
        <Form form={refundForm} layout="vertical" onFinish={handleRefund}>
          <Form.Item name="reason" label="退款原因">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setRefundOpen(false);
                  refundForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button
                type="primary"
                danger
                htmlType="submit"
                loading={submitting}
              >
                确认退款
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="拒绝提现"
        open={rejectOpen}
        onCancel={() => {
          setRejectOpen(false);
          rejectForm.resetFields();
        }}
        footer={null}
      >
        <p>
          确认拒绝用户 <strong>{selectedWithdrawal?.user_id}</strong> 的提现
          申请 <strong>{formatCents(selectedWithdrawal?.amount ?? 0)}</strong>
          ？资金将退回用户钱包。
        </p>
        <Form
          form={rejectForm}
          layout="vertical"
          onFinish={handleRejectWithdrawal}
        >
          <Form.Item name="note" label="拒绝原因">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setRejectOpen(false);
                  rejectForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button
                type="primary"
                danger
                htmlType="submit"
                loading={submitting}
              >
                确认拒绝
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </AdminLayout>
  );
}
