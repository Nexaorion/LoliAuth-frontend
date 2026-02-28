"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Table, Button, Typography, App, Tag, Popconfirm, Space } from "antd";
import { PlusOutlined, DeleteOutlined, CopyOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";
import DeveloperLayout from "@/components/layout/DeveloperLayout";
import { getClients, deleteClient } from "@/lib/api/developer";
import type { OAuthClient } from "@/types";

const { Title } = Typography;

export default function DeveloperAppsPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClients();
      setClients(data);
    } catch {
      message.error("加载应用列表失败");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleDelete = async (clientId: string) => {
    try {
      await deleteClient(clientId);
      message.success("应用已删除");
      fetchClients();
    } catch {
      message.error("删除失败");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success("已复制");
  };

  const columns: ColumnsType<OAuthClient> = [
    {
      title: "应用名称",
      dataIndex: "app_name",
      key: "app_name",
    },
    {
      title: "Client ID",
      dataIndex: "client_id",
      key: "client_id",
      render: (text: string) => (
        <Space>
          <code style={{ fontSize: 12 }}>{text}</code>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(text)}
          />
        </Space>
      ),
    },
    {
      title: "机密客户端",
      dataIndex: "is_confidential",
      key: "is_confidential",
      render: (v: boolean) =>
        v ? <Tag color="blue">是</Tag> : <Tag>否</Tag>,
    },
    {
      title: "回调地址",
      dataIndex: "redirect_uris",
      key: "redirect_uris",
      render: (uris: string[]) => uris.join(", "),
      ellipsis: true,
    },
    {
      title: "操作",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="确认删除此应用？"
          description="删除后不可恢复"
          onConfirm={() => handleDelete(record.client_id)}
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small">
            删除
          </Button>
        </Popconfirm>
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
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          我的应用
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push("/developer/apps/create")}
        >
          创建应用
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={clients}
        rowKey="client_id"
        loading={loading}
        pagination={false}
      />
    </DeveloperLayout>
  );
}
