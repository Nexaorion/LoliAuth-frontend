"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Tag,
  Button,
  Input,
  Select,
  Space,
  Typography,
  App,
  Popconfirm,
} from "antd";
import {
  SearchOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  getAdminClients,
  updateClientStatus,
  deleteAdminClient,
} from "@/lib/api/admin";
import type { AdminClient } from "@/types";

const { Title } = Typography;

const clientStatusOptions = [
  { value: "", label: "全部状态" },
  { value: "pending", label: "待审核" },
  { value: "active", label: "已通过" },
  { value: "rejected", label: "已拒绝" },
  { value: "suspended", label: "已暂停" },
];

const clientStatusMap: Record<string, { color: string; text: string }> = {
  pending: { color: "processing", text: "待审核" },
  active: { color: "success", text: "已通过" },
  rejected: { color: "error", text: "已拒绝" },
  suspended: { color: "warning", text: "已暂停" },
};

export default function AdminClientsPage() {
  const { message } = App.useApp();
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [appName, setAppName] = useState("");
  const [status, setStatus] = useState("");

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminClients({
        page,
        page_size: pageSize,
        ...(appName && { app_name: appName }),
        ...(status && { status }),
      });
      setClients(res.data);
      setTotal(res.total);
    } catch {
      message.error("加载应用列表失败");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appName, status, message]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleStatusChange = async (
    clientId: string,
    newStatus: "active" | "rejected" | "suspended"
  ) => {
    try {
      await updateClientStatus(clientId, { status: newStatus });
      message.success("状态已更新");
      fetchClients();
    } catch {
      message.error("更新失败");
    }
  };

  const handleDelete = async (clientId: string) => {
    try {
      await deleteAdminClient(clientId);
      message.success("应用已删除");
      fetchClients();
    } catch {
      message.error("删除失败");
    }
  };

  const columns: ColumnsType<AdminClient> = [
    { title: "应用名称", dataIndex: "app_name", key: "app_name" },
    {
      title: "Client ID",
      dataIndex: "client_id",
      key: "client_id",
      render: (v: string) => <code style={{ fontSize: 12 }}>{v}</code>,
      ellipsis: true,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (s: string) => {
        const cfg = clientStatusMap[s];
        return cfg ? <Tag color={cfg.color}>{cfg.text}</Tag> : s;
      },
    },
    {
      title: "允许的 Scope",
      dataIndex: "allowed_scopes",
      key: "allowed_scopes",
      render: (scopes: string[]) => (
        <Space size={[0, 4]} wrap>
          {scopes?.map((s) => {
            const isSensitive = s === "realname" || s === "real_id_number";
            return (
              <Tag key={s} color={isSensitive ? "orange" : "blue"}>
                {s}
              </Tag>
            );
          })}
        </Space>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "action",
      width: 240,
      render: (_, record) => (
        <Space>
          {record.status === "pending" && (
            <>
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                onClick={() =>
                  handleStatusChange(record.client_id, "active")
                }
              >
                通过
              </Button>
              <Button
                type="text"
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() =>
                  handleStatusChange(record.client_id, "rejected")
                }
              >
                拒绝
              </Button>
            </>
          )}
          {record.status === "active" && (
            <Button
              type="text"
              size="small"
              onClick={() =>
                handleStatusChange(record.client_id, "suspended")
              }
            >
              暂停
            </Button>
          )}
          {record.status === "suspended" && (
            <Button
              type="text"
              size="small"
              onClick={() =>
                handleStatusChange(record.client_id, "active")
              }
            >
              恢复
            </Button>
          )}
          <Popconfirm
            title="确认删除此应用？"
            onConfirm={() => handleDelete(record.client_id)}
          >
            <Button type="text" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Title level={4}>应用管理</Title>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="搜索应用名"
          prefix={<SearchOutlined />}
          value={appName}
          onChange={(e) => {
            setAppName(e.target.value);
            setPage(1);
          }}
          style={{ width: 200 }}
          allowClear
        />
        <Select
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={clientStatusOptions}
          style={{ width: 120 }}
        />
      </Space>
      <Table
        columns={columns}
        dataSource={clients}
        rowKey="client_id"
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
    </AdminLayout>
  );
}
