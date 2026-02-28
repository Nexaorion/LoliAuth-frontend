"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Typography,
  App,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Popconfirm,
  Tooltip,
  Switch,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import DeveloperLayout from "@/components/layout/DeveloperLayout";
import {
  getDeveloperPlans,
  createPlan,
  updatePlan,
  deletePlan,
} from "@/lib/api/billing";
import { getClients } from "@/lib/api/developer";
import type {
  SubscriptionPlan,
  OAuthClient,
  CreatePlanRequest,
  UpdatePlanRequest,
} from "@/types";

const { Title } = Typography;

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatInterval(days: number): string {
  if (days === 1) return "每天";
  if (days === 7) return "每周";
  if (days === 30) return "每月";
  if (days === 365) return "每年";
  return `每 ${days} 天`;
}

export default function DeveloperSubscriptionsPage() {
  const { message } = App.useApp();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDeveloperPlans({ page, page_size: pageSize });
      setPlans(res.data);
      setTotal(res.total);
    } catch {
      message.error("加载订阅计划失败");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, message]);

  const fetchClients = useCallback(async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleCreate = async (values: CreatePlanRequest) => {
    setSubmitting(true);
    try {
      await createPlan(values);
      message.success("计划已创建");
      setCreateOpen(false);
      createForm.resetFields();
      fetchPlans();
    } catch {
      message.error("创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (values: UpdatePlanRequest) => {
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      await updatePlan(selectedPlan.id, values);
      message.success("计划已更新");
      setEditOpen(false);
      editForm.resetFields();
      fetchPlans();
    } catch {
      message.error("修改失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (planId: string) => {
    try {
      await deletePlan(planId);
      message.success("计划已停用");
      fetchPlans();
    } catch {
      message.error("停用失败");
    }
  };

  const columns: ColumnsType<SubscriptionPlan> = [
    {
      title: "计划名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "金额",
      dataIndex: "amount",
      key: "amount",
      width: 100,
      render: (v: number) => formatCents(v),
    },
    {
      title: "周期",
      dataIndex: "interval_days",
      key: "interval_days",
      width: 100,
      render: (v: number) => formatInterval(v),
    },
    {
      title: "状态",
      dataIndex: "active",
      key: "active",
      width: 80,
      render: (v: boolean) =>
        v ? <Tag color="success">启用</Tag> : <Tag color="default">停用</Tag>,
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
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedPlan(record);
                editForm.setFieldsValue({
                  name: record.name,
                  description: record.description,
                  amount: record.amount,
                  interval_days: record.interval_days,
                  active: record.active,
                });
                setEditOpen(true);
              }}
            />
          </Tooltip>
          {record.active && (
            <Popconfirm
              title="确认停用此计划？"
              description="已有订阅将在当前周期结束后过期"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
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
          订阅管理
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateOpen(true)}
        >
          创建订阅计划
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={plans}
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
        title="创建订阅计划"
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
            name="name"
            label="计划名称"
            rules={[{ required: true, message: "请输入名称" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="amount"
            label="每周期金额（美分）"
            rules={[{ required: true, message: "请输入金额" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="interval_days"
            label="计费周期"
            rules={[{ required: true, message: "请选择周期" }]}
          >
            <Select
              placeholder="选择计费周期"
              options={[
                { value: 1, label: "每天" },
                { value: 7, label: "每周" },
                { value: 30, label: "每月" },
                { value: 90, label: "每季度" },
                { value: 365, label: "每年" },
              ]}
            />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setCreateOpen(false);
                  createForm.resetFields();
                }}
              >
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
        title="修改订阅计划"
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          editForm.resetFields();
        }}
        footer={null}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
          <Form.Item name="name" label="计划名称">
            <Input />
          </Form.Item>
          <Form.Item name="amount" label="每周期金额（美分）">
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="interval_days" label="计费周期（天）">
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="active" label="是否启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setEditOpen(false);
                  editForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </DeveloperLayout>
  );
}
