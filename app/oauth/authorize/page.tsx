"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  Button,
  Typography,
  List,
  App,
  Spin,
  Result,
  Space,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  MailOutlined,
  IdcardOutlined,
  ContactsOutlined,
  KeyOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { authorize, consent } from "@/lib/api/oauth";
import type { AuthorizeConsentResponse } from "@/types";
import type { AxiosError } from "axios";
import type { ApiError } from "@/types";

const { Title, Text, Paragraph } = Typography;

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

function ScopeItem({ scope }: { scope: string }) {
  const display = SCOPE_DISPLAY[scope] ?? {
    icon: <UserOutlined />,
    title: scope,
    description: `授权访问 ${scope}`,
    color: "#8c8c8c",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 0",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: display.sensitive
            ? "rgba(250,130,22,0.12)"
            : `${display.color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
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
            gap: 6,
            marginBottom: 2,
          }}
        >
          <Text strong style={{ fontSize: 14 }}>
            {display.title}
          </Text>
          {display.sensitive && (
            <WarningOutlined
              style={{ color: "#fa8c16", fontSize: 13 }}
            />
          )}
        </div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {display.description}
        </Text>
      </div>
    </div>
  );
}

function AuthorizeContent() {
  const searchParams = useSearchParams();
  const { message } = App.useApp();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [consentData, setConsentData] = useState<AuthorizeConsentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clientId = searchParams.get("client_id") || "";
  const redirectUri = searchParams.get("redirect_uri") || "";
  const scope = searchParams.get("scope") || "";
  const state = searchParams.get("state") || "";
  const codeChallenge = searchParams.get("code_challenge") || "";
  const codeChallengeMethod = searchParams.get("code_challenge_method") || "S256";

  const fetchAuthorize = useCallback(async () => {
    if (!clientId || !redirectUri || !state || !codeChallenge) {
      setError("缺少必要的授权参数");
      setLoading(false);
      return;
    }

    try {
      const res = await authorize({
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: codeChallengeMethod as "S256",
      });

      // Auto-redirect if already authorized
      if ("redirect_uri" in res) {
        window.location.href = res.redirect_uri;
        return;
      }

      // Needs consent
      if ("consent_required" in res) {
        setConsentData(res);
      }
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      setError(
        axiosErr.response?.data?.error_description || "授权请求失败"
      );
    } finally {
      setLoading(false);
    }
  }, [clientId, redirectUri, scope, state, codeChallenge, codeChallengeMethod]);

  useEffect(() => {
    fetchAuthorize();
  }, [fetchAuthorize]);

  const handleConsent = async (approved: boolean) => {
    setSubmitting(true);
    try {
      const res = await consent({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: codeChallengeMethod as "S256",
        approved,
      });
      window.location.href = res.redirect_uri;
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      message.error(
        axiosErr.response?.data?.error_description || "授权操作失败"
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16 }}>正在处理授权请求…</Paragraph>
      </div>
    );
  }

  if (error) {
    return <Result status="error" title="授权失败" subTitle={error} />;
  }

  if (!consentData) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16 }}>正在重定向…</Paragraph>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#f5f5f5",
      }}
    >
      <Card style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={4}>授权请求</Title>
          <Paragraph>
            <Text strong>{consentData.client_name}</Text> 请求获取以下权限：
          </Paragraph>
        </div>

        <List
          dataSource={consentData.scopes}
          renderItem={(scope) => (
            <List.Item
              style={{
                borderBottom: "1px solid #f0f0f0",
                padding: "0 4px",
              }}
            >
              <ScopeItem scope={scope} />
            </List.Item>
          )}
          style={{ marginBottom: 24 }}
        />

        <Space style={{ width: "100%", justifyContent: "center" }} size="middle">
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={submitting}
            onClick={() => handleConsent(true)}
            size="large"
          >
            同意授权
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            loading={submitting}
            onClick={() => handleConsent(false)}
            size="large"
          >
            拒绝
          </Button>
        </Space>
      </Card>
    </div>
  );
}

export default function AuthorizePage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: "center", padding: 80 }}>
          <Spin size="large" />
        </div>
      }
    >
      <AuthorizeContent />
    </Suspense>
  );
}
