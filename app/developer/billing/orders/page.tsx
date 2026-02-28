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
  InputNumber,
  Popconfirm,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  RollbackOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import DeveloperLayout from "@/components/layout/DeveloperLayout";
import {
  getDeveloperOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  refundOrder,
} from "@/lib/api/billing";
import { getClients } from "@/lib/api/developer";
import type { Order, OAuthClient, CreateOrderRequest, UpdateOrderRequest } from "@/types";

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

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function DeveloperOrdersPage() {
  const { message } = App.useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [refundForm] = Form.useForm();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDeveloperOrders({
        page,
        page_size: pageSize,
        status: statusFilter || undefined,
      });
      setOrders(res.data);
      setTotal(res.total);
    } catch {
      message.error("加载订单列表失败");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, message]);

  const fetchClients = useCallback(async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleCreate = async (values: CreateOrderRequest) => {
    setSubmitting(true);
    try {
      await createOrder(values);
      message.success("订单已创建");
      setCreateOpen(false);
      createForm.resetFields();
      fetchOrders();
    } catch {
      message.error("创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (values: UpdateOrderRequest) => {
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      await updateOrder(selectedOrder.id, values);
      message.success("订单已更新");
      setEditOpen(false);
      editForm.resetFields();
      fetchOrders();
    } catch {
      message.error("修改失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
      message.success("订单已删除");
      fetchOrders();
    } catch {
      message.error("删除失败");
    }
  };

  const handleRefund = async (values: { reason?: string }) => {
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      await refundOrder(selectedOrder.id, values);
      message.success("退款成功");
      setRefundOpen(false);
      refundForm.resetFields();
      fetchOrders();
    } catch {
      message.error("退款失败");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<Order> = [
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
      width: 180,
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
          {record.status === "pending" && (
            <>
              <Tooltip title="编辑">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setSelectedOrder(record);
                    editForm.setFieldsValue({
                      title: record.title,
                      amount: record.amount,
                      description: record.description,
                      payer_id: record.payer_id,
                    });
                    setEditOpen(true);
                  }}
                />
              </Tooltip>
              <Popconfirm
                title="确认删除此订单？"
                onConfirm={() => handleDelete(record.id)}
              >
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </>
          )}
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

  return (
    <DeveloperLayout>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          订单管理
        </Title>
        <Space wrap>
          <Select
            style={{ width: 130 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "", label: "全部状态" },
              { value: "pending", label: "待支付" },
              { value: "paid", label: "已支付" },
              { value: "cancelled", label: "已取消" },
              { value: "refunded", label: "已退款" },
              { value: "expired", label: "已过期" },
            ]}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
          >
            创建订单
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />
      <Modal
        title="创建订单"
        open={createOpen}
        onCancel={() => {
          setCreateOpen(false);
          createForm.resetFields();
        }}
        footer={null}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="client_id"
            label="关联应用"
            rules={[{ required: true, message: "请选择应用" }]}
          >
            <Select
              placeholder="选择 OAuth 应用"
              options={clients.map((c) => ({
                value: c.client_id,
                label: `${c.app_name} (${c.client_id.slice(0, 8)}...)`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="title"
            label="订单标题"
            rules={[{ required: true, message: "请输入标题" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="amount"
            label="金额（美分）"
            rules={[{ required: true, message: "请输入金额" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="payer_id" label="付款方用户 ID">
            <Input placeholder="可选，留空则任意用户可支付" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="expires_in" label="过期时间（秒）">
            <InputNumber min={60} style={{ width: "100%" }} placeholder="留空不过期" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => { setCreateOpen(false); createForm.resetFields(); }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="修改订单"
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          editForm.resetFields();
        }}
        footer={null}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
          <Form.Item name="title" label="订单标题">
            <Input />
          </Form.Item>
          <Form.Item name="amount" label="金额（美分）">
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="payer_id" label="付款方用户 ID">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => { setEditOpen(false); editForm.resetFields(); }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
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
              <Button onClick={() => { setRefundOpen(false); refundForm.resetFields(); }}>
                取消
              </Button>
              <Button type="primary" danger htmlType="submit" loading={submitting}>
                确认退款
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="订单详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={<Button onClick={() => setDetailOpen(false)}>关闭</Button>}
      >
        {selectedOrder && (
          <div style={{ lineHeight: 2 }}>
            <p><strong>订单 ID：</strong>{selectedOrder.id}</p>
            <p><strong>标题：</strong>{selectedOrder.title}</p>
            <p><strong>金额：</strong>{formatCents(selectedOrder.amount)}</p>
            <p><strong>状态：</strong><Tag color={statusColorMap[selectedOrder.status]}>{statusLabelMap[selectedOrder.status]}</Tag></p>
            <p><strong>应用 ID：</strong>{selectedOrder.client_id}</p>
            <p><strong>付款方 ID：</strong>{selectedOrder.payer_id || "-"}</p>
            {selectedOrder.description && <p><strong>描述：</strong>{selectedOrder.description}</p>}
            {selectedOrder.paid_at && <p><strong>支付时间：</strong>{new Date(selectedOrder.paid_at).toLocaleString("zh-CN")}</p>}
            {selectedOrder.refunded_at && <p><strong>退款时间：</strong>{new Date(selectedOrder.refunded_at).toLocaleString("zh-CN")}</p>}
            {selectedOrder.refund_reason && <p><strong>退款原因：</strong>{selectedOrder.refund_reason}</p>}
            {selectedOrder.expires_at && <p><strong>过期时间：</strong>{new Date(selectedOrder.expires_at).toLocaleString("zh-CN")}</p>}
            <p><strong>创建时间：</strong>{new Date(selectedOrder.created_at).toLocaleString("zh-CN")}</p>
          </div>
        )}
      </Modal>
    </DeveloperLayout>
  );
}
