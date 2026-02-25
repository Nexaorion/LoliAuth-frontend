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
  Tag,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { authorize, consent } from "@/lib/api/oauth";
import type { AuthorizeConsentResponse } from "@/types";
import type { AxiosError } from "axios";
import type { ApiError } from "@/types";

const { Title, Text, Paragraph } = Typography;

const SCOPE_LABELS: Record<string, string> = {
  openid: "获取你的用户标识",
  profile: "获取你的个人资料",
  email: "获取你的邮箱地址",
  realname: "获取你的实名认证姓名",
  real_id_number: "获取你的身份证号码",
};

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
          renderItem={(scope) => {
            const isSensitive = scope === "realname" || scope === "real_id_number";
            return (
              <List.Item>
                <Tag color={isSensitive ? "orange" : "blue"}>
                  {isSensitive && <ExclamationCircleOutlined style={{ marginRight: 4 }} />}
                  {scope}
                </Tag>
                <Text type={isSensitive ? "warning" : undefined}>
                  {SCOPE_LABELS[scope] || scope}
                </Text>
              </List.Item>
            );
          }}
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
