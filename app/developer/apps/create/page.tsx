"use client";

import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Switch,
  Checkbox,
  Typography,
  App,
  Modal,
  Space,
  Alert,
} from "antd";
import { MinusCircleOutlined, PlusOutlined, CopyOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { createClient } from "@/lib/api/developer";
import type { AxiosError } from "axios";
import type { ApiError, OAuthClientCreated } from "@/types";

const { Title, Paragraph, Text } = Typography;

const SCOPE_OPTIONS = [
  { label: "openid", value: "openid" },
  { label: "profile", value: "profile" },
  { label: "email", value: "email" },
  { label: "realname（实名姓名）", value: "realname" },
  { label: "real_id_number（身份证号码）", value: "real_id_number" },
];

const GRANT_TYPE_OPTIONS = [
  { label: "authorization_code", value: "authorization_code" },
  { label: "refresh_token", value: "refresh_token" },
  { label: "client_credentials", value: "client_credentials" },
];

export default function CreateAppPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [secretModal, setSecretModal] = useState<OAuthClientCreated | null>(
    null
  );

  const onFinish = async (values: {
    app_name: string;
    redirect_uris: { uri: string }[];
    allowed_scopes: string[];
    allowed_grant_types: string[];
    is_confidential: boolean;
  }) => {
    setLoading(true);
    try {
      const result = await createClient({
        app_name: values.app_name,
        redirect_uris: values.redirect_uris.map((r) => r.uri),
        allowed_scopes: values.allowed_scopes,
        allowed_grant_types: values.allowed_grant_types,
        is_confidential: values.is_confidential ?? true,
      });
      setSecretModal(result);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      message.error(
        error.response?.data?.error_description || "创建失败"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSecretModalClose = () => {
    setSecretModal(null);
    router.push("/developer/apps");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success("已复制到剪贴板");
  };

  return (
    <AppLayout>
      <Title level={3}>创建应用</Title>
      <Form
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          allowed_scopes: ["openid", "profile", "email"],
          allowed_grant_types: ["authorization_code", "refresh_token"],
          is_confidential: true,
          redirect_uris: [{ uri: "" }],
        }}
        style={{ maxWidth: 600, marginTop: 16 }}
      >
        <Form.Item
          name="app_name"
          label="应用名称"
          rules={[{ required: true, message: "请输入应用名称" }]}
        >
          <Input placeholder="我的应用" />
        </Form.Item>

        <Form.List
          name="redirect_uris"
          rules={[
            {
              validator: async (_, uris) => {
                if (!uris || uris.length < 1) {
                  return Promise.reject(new Error("至少添加一个回调地址"));
                }
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map((field) => (
                <Form.Item
                  key={field.key}
                  label={field.key === 0 ? "回调地址" : undefined}
                  required
                >
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
                        placeholder="https://localhost:3000/callback"
                        style={{ width: 480 }}
                      />
                    </Form.Item>
                    {fields.length > 1 && (
                      <MinusCircleOutlined onClick={() => remove(field.name)} />
                    )}
                  </Space>
                </Form.Item>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  添加回调地址
                </Button>
                <Form.ErrorList errors={errors} />
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item name="allowed_scopes" label="允许的 Scope">
          <Checkbox.Group options={SCOPE_OPTIONS} />
        </Form.Item>

        <Form.Item name="allowed_grant_types" label="允许的授权类型">
          <Checkbox.Group options={GRANT_TYPE_OPTIONS} />
        </Form.Item>

        <Form.Item
          name="is_confidential"
          label="机密客户端"
          valuePropName="checked"
        >
          <Switch checkedChildren="是" unCheckedChildren="否" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              创建
            </Button>
            <Button onClick={() => router.back()}>取消</Button>
          </Space>
        </Form.Item>
      </Form>

      <Modal
        title="应用创建成功"
        open={!!secretModal}
        onCancel={handleSecretModalClose}
        onOk={handleSecretModalClose}
        okText="我已保存"
        closable={false}
        maskClosable={false}
      >
        {secretModal && (
          <>
            <Alert
              message="请立即保存 Client Secret，关闭后将无法再次查看！"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Paragraph>
              <Text strong>Client ID：</Text>
              <br />
              <code>{secretModal.client_id}</code>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(secretModal.client_id)}
              />
            </Paragraph>
            <Paragraph>
              <Text strong>Client Secret：</Text>
              <br />
              <code>{secretModal.client_secret}</code>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(secretModal.client_secret)}
              />
            </Paragraph>
          </>
        )}
      </Modal>
    </AppLayout>
  );
}
