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
  Row,
  Col,
  Card,
  List,
  Divider,
  Tooltip,
} from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AppstoreOutlined,
  EyeOutlined,
  UserOutlined,
  MailOutlined,
  IdcardOutlined,
  ContactsOutlined,
  KeyOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
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

interface ScopeDisplay {
  icon: React.ReactNode;
  title: string;
  description: string;
  sensitive?: boolean;
  color: string;
}

const SCOPE_DISPLAY: Record<string, ScopeDisplay> = {
  openid: {
    icon: <KeyOutlined />,
    title: "用户唯一标识",
    description: "应用将获取你的唯一账号 ID，用于识别你的身份",
    color: "#1677ff",
  },
  profile: {
    icon: <UserOutlined />,
    title: "基本个人资料",
    description: "应用将获取你的用户名、头像等基本信息",
    color: "#52c41a",
  },
  email: {
    icon: <MailOutlined />,
    title: "电子邮箱地址",
    description: "应用将获取你的注册邮箱地址",
    color: "#1677ff",
  },
  realname: {
    icon: <ContactsOutlined />,
    title: "实名认证姓名",
    description: "应用将获取你通过实名认证的真实姓名",
    sensitive: true,
    color: "#fa8c16",
  },
  real_id_number: {
    icon: <IdcardOutlined />,
    title: "身份证号码",
    description: "应用将获取你的身份证号码（敏感信息）",
    sensitive: true,
    color: "#f5222d",
  },
};

interface ConsentPreviewProps {
  appName: string;
  scopes: string[];
}

function ConsentPreview({ appName, scopes }: ConsentPreviewProps) {
  const displayName = appName?.trim() || "你的应用名称";
  const displayScopes = scopes?.length ? scopes : ["openid"];

  return (
    <div style={{ position: "sticky", top: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          color: "#8c8c8c",
          fontSize: 13,
        }}
      >
        <EyeOutlined />
        <span>授权同意屏幕预览</span>
      </div>
      <div
        style={{
          background: "#f5f5f5",
          borderRadius: 12,
          padding: 20,
          minHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Card
          style={{
            width: "100%",
            maxWidth: 380,
            boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
            borderRadius: 12,
          }}
          styles={{ body: { padding: "28px 24px 24px" } }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <AppstoreOutlined style={{ fontSize: 24, color: "#fff" }} />
            </div>
            <Title level={5} style={{ marginBottom: 4 }}>
              授权请求
            </Title>
            <Paragraph style={{ margin: 0, color: "#595959" }}>
              <Text strong>{displayName}</Text> 请求获取以下权限：
            </Paragraph>
          </div>

          <Divider style={{ margin: "12px 0" }} />

          {/* Scope list */}
          <List
            dataSource={displayScopes}
            renderItem={(scope) => {
              const display = SCOPE_DISPLAY[scope] ?? {
                icon: <UserOutlined />,
                title: scope,
                description: `授权访问 ${scope}`,
                color: "#8c8c8c",
              };
              return (
                <List.Item
                  style={{
                    padding: "6px 0",
                    border: "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: display.sensitive
                          ? "rgba(250,130,22,0.12)"
                          : `${display.color}18`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 15,
                        color: display.color,
                        flexShrink: 0,
                      }}
                    >
                      {display.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          marginBottom: 1,
                        }}
                      >
                        <Text strong style={{ fontSize: 12 }}>
                          {display.title}
                        </Text>
                        {display.sensitive && (
                          <WarningOutlined
                            style={{ color: "#fa8c16", fontSize: 11 }}
                          />
                        )}
                      </div>
                      <Text
                        type="secondary"
                        style={{ fontSize: 11, lineHeight: 1.3 }}
                      >
                        {display.description}
                      </Text>
                    </div>
                  </div>
                </List.Item>
              );
            }}
            style={{ marginBottom: 20 }}
          />

          <Divider style={{ margin: "0 0 16px" }} />

          {/* Action buttons */}
          <Space
            style={{ width: "100%", justifyContent: "center" }}
            size="middle"
          >
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              size="large"
              disabled
            >
              同意授权
            </Button>
            <Button
              danger
              icon={<CloseCircleOutlined />}
              size="large"
              disabled
            >
              拒绝
            </Button>
          </Space>

          <div style={{ textAlign: "center", marginTop: 12 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              由 LoliAuth 提供授权保护
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function CreateAppPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [secretModal, setSecretModal] = useState<OAuthClientCreated | null>(
    null
  );
  const [previewAppName, setPreviewAppName] = useState("");
  const [previewScopes, setPreviewScopes] = useState<string[]>([
    "openid",
    "profile",
    "email",
  ]);

  const handleValuesChange = (
    _: unknown,
    allValues: {
      app_name?: string;
      allowed_scopes?: string[];
    }
  ) => {
    if (allValues.app_name !== undefined) {
      setPreviewAppName(allValues.app_name);
    }
    if (allValues.allowed_scopes !== undefined) {
      setPreviewScopes(allValues.allowed_scopes ?? []);
    }
  };

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
      <Row gutter={[48, 0]} align="top" style={{ marginTop: 16 }}>
        {/* Form column */}
        <Col xs={24} lg={13} xl={12}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onValuesChange={handleValuesChange}
            initialValues={{
              allowed_scopes: ["openid", "profile", "email"],
              allowed_grant_types: ["authorization_code", "refresh_token"],
              is_confidential: true,
              redirect_uris: [{ uri: "" }],
            }}
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
                            style={{ width: 360 }}
                          />
                        </Form.Item>
                        {fields.length > 1 && (
                          <MinusCircleOutlined
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
              label={
                <Space size={4}>
                  机密客户端
                  <Tooltip
                    title={
                      <div>
                        <p style={{ margin: "0 0 6px", fontWeight: 600 }}>
                          什么是机密客户端？
                        </p>
                        <p style={{ margin: "0 0 6px" }}>
                          机密客户端是能够安全保管 Client Secret 的应用，通常是运行在服务器端的后端服务。
                        </p>
                        <p style={{ margin: 0 }}>
                          开启后，应用在换取 Token 时必须提供正确的 Client
                          Secret，安全性更高。若你的应用是移动端、浏览器扩展等公开客户端（无法安全存储密钥），应关闭此选项。
                        </p>
                      </div>
                    }
                    overlayStyle={{ maxWidth: 320 }}
                  >
                    <InfoCircleOutlined
                      style={{ color: "#8c8c8c", cursor: "help" }}
                    />
                  </Tooltip>
                </Space>
              }
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
        </Col>

        {/* Preview column — desktop only */}
        <Col xs={0} lg={11} xl={12}>
          <ConsentPreview appName={previewAppName} scopes={previewScopes} />
        </Col>
      </Row>

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
