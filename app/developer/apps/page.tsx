"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Typography,
  App,
  Tag,
  Popconfirm,
  Space,
  Modal,
  Form,
  Input,
  Checkbox,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  EditOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";
import DeveloperLayout from "@/components/layout/DeveloperLayout";
import { getClients, deleteClient, updateClient } from "@/lib/api/developer";
import type { OAuthClient, UpdateClientRequest } from "@/types";

const { Title } = Typography;

const SCOPE_OPTIONS = [
  { label: "openid", value: "openid" },
  { label: "profile", value: "profile" },
  { label: "email", value: "email" },
  { label: "realname", value: "realname" },
  { label: "real_id_number", value: "real_id_number" },
];

const GRANT_TYPE_OPTIONS = [
  { label: "authorization_code", value: "authorization_code" },
  { label: "refresh_token", value: "refresh_token" },
  { label: "client_credentials", value: "client_credentials" },
];

export default function DeveloperAppsPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editingClient, setEditingClient] = useState<OAuthClient | null>(null);
  const [editForm] = Form.useForm();

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

  const openEditModal = (record: OAuthClient) => {
    setEditingClient(record);
    editForm.setFieldsValue({
      app_name: record.app_name,
      redirect_uris: record.redirect_uris.map((uri) => ({ uri })),
      allowed_scopes: record.allowed_scopes,
      allowed_grant_types: record.allowed_grant_types,
    });
    setEditModalOpen(true);
  };

  const handleEdit = async (values: {
    app_name: string;
    redirect_uris: { uri: string }[];
    allowed_scopes: string[];
    allowed_grant_types: string[];
  }) => {
    if (!editingClient) return;
    setEditLoading(true);
    try {
      const payload: UpdateClientRequest = {
        app_name: values.app_name,
        redirect_uris: values.redirect_uris.map((item) => item.uri),
        allowed_scopes: values.allowed_scopes,
        allowed_grant_types: values.allowed_grant_types,
      };
      await updateClient(editingClient.client_id, payload);
      message.success("应用配置已更新");
      setEditModalOpen(false);
      fetchClients();
    } catch {
      message.error("更新失败，请稍后再试");
    } finally {
      setEditLoading(false);
    }
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
      width: 140,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除此应用？"
            description="删除后不可恢复"
            onConfirm={() => handleDelete(record.client_id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} size="small">
              删除
            </Button>
          </Popconfirm>
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

      <Modal
        title="编辑应用配置"
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        okText="保存"
        cancelText="取消"
        confirmLoading={editLoading}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEdit}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="app_name"
            label="应用名称"
            rules={[{ required: true, message: "请输入应用名称" }]}
          >
            <Input placeholder="请输入应用名称" />
          </Form.Item>

          <Form.Item label="回调地址">
            <Form.List
              name="redirect_uris"
              rules={[
                {
                  validator: async (_, items) => {
                    if (!items || items.length === 0) {
                      return Promise.reject(new Error("至少需要一个回调地址"));
                    }
                  },
                },
              ]}
            >
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map((field) => (
                    <Form.Item key={field.key} style={{ marginBottom: 8 }}>
                      <Space align="baseline" style={{ width: "100%" }}>
                        <Form.Item
                          {...field}
                          name={[field.name, "uri"]}
                          rules={[
                            { required: true, message: "请输入回调地址" },
                            { type: "url", message: "请输入有效的 URL" },
                          ]}
                          noStyle
                        >
                          <Input
                            placeholder="https://example.com/callback"
                            style={{ width: 420 }}
                          />
                        </Form.Item>
                        {fields.length > 1 && (
                          <MinusCircleOutlined
                            style={{ color: "#ff4d4f", cursor: "pointer" }}
                            onClick={() => remove(field.name)}
                          />
                        )}
                      </Space>
                    </Form.Item>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      icon={<PlusOutlined />}
                      style={{ width: "100%" }}
                    >
                      添加回调地址
                    </Button>
                    <Form.ErrorList errors={errors} />
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item name="allowed_scopes" label="允许的 Scope">
            <Checkbox.Group options={SCOPE_OPTIONS} />
          </Form.Item>

          <Form.Item name="allowed_grant_types" label="允许的授权类型">
            <Checkbox.Group options={GRANT_TYPE_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </DeveloperLayout>
  );
}
