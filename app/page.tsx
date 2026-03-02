"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Typography, Card, Tag, Tooltip, Button, Row, Col, Grid, Skeleton } from "antd";
import {
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  StopOutlined,
  CopyOutlined,
  CheckOutlined,
  MailOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import AppLayout from "@/components/layout/AppLayout";
import { useAuthStore } from "@/stores/authStore";
import { getKycStatus } from "@/lib/api/kyc";
import type { KycStatus, User } from "@/types";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "上午好";
  if (hour >= 11 && hour < 14) return "中午好";
  if (hour >= 14 && hour < 21) return "晚上好";
  return "夜深了";
}

function resolveDisplayName(user: User | null): string {
  if (!user) return "用户";
  return user.name || user.given_name || user.email?.split("@")[0] || "用户";
}

function maskEmail(email?: string): string {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${"*".repeat(Math.min(local.length - 2, 4))}${local.slice(-1)}@${domain}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusConfig: Record<string, { color: "success" | "error" | "warning"; text: string }> = {
  active: { color: "success", text: "正常" },
  disabled: { color: "error", text: "已禁用" },
  suspended: { color: "warning", text: "已暂停" },
};

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}

function InfoItem({ icon, label, children }: InfoItemProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Text
        type="secondary"
        style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
      >
        {icon}
        {label}
      </Text>
      <div style={{ fontSize: 14, fontWeight: 500, wordBreak: "break-all" }}>{children}</div>
    </div>
  );
}

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const screens = useBreakpoint();
  const isMobile = screens.md === false;

  const fetchKyc = useCallback(async () => {
    try {
      const s = await getKycStatus();
      setKycStatus(s);
    } catch {
      // ignore
    } finally {
      setKycLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKyc();
  }, [fetchKyc]);

  const handleCopyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isKycVerified = kycStatus?.status === "success";
  const userStatus = user?.status ? statusConfig[user.status] : null;

  return (
    <AppLayout>
      {/* 问候语 */}
      <div style={{ marginBottom: 28 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
          {getGreeting()}，{resolveDisplayName(user)}
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          欢迎回来，以下是您的账户概览。
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {/* 账户信息 */}
        <Col xs={24} md={12} lg={8}>
          <Card title="账户信息" size="small" variant="outlined" style={{ height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <InfoItem icon={<IdcardOutlined />} label="用户 ID">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Text code style={{ fontSize: 12, wordBreak: "break-all" }}>
                    {user?.id ?? "—"}
                  </Text>
                  {user?.id && (
                    <Tooltip title={copied ? "已复制" : "复制 ID"}>
                      <Button
                        type="text"
                        size="small"
                        icon={
                          copied ? (
                            <CheckOutlined style={{ color: "#52c41a" }} />
                          ) : (
                            <CopyOutlined />
                          )
                        }
                        onClick={handleCopyId}
                        style={{
                          padding: 0,
                          height: 18,
                          width: 18,
                          minWidth: 18,
                          flexShrink: 0,
                        }}
                      />
                    </Tooltip>
                  )}
                </div>
              </InfoItem>

              <InfoItem icon={<CheckCircleOutlined />} label="账户状态">
                {userStatus ? (
                  <Tag color={userStatus.color}>{userStatus.text}</Tag>
                ) : (
                  <span>—</span>
                )}
              </InfoItem>

              <InfoItem icon={<SafetyCertificateOutlined />} label="实名状态">
                {kycLoading ? (
                  <Skeleton.Button
                    size="small"
                    active
                    style={{ width: 64, height: 22 }}
                  />
                ) : (
                  <Tag
                    color={isKycVerified ? "blue" : "orange"}
                    icon={
                      isKycVerified ? <CheckCircleOutlined /> : <StopOutlined />
                    }
                  >
                    {isKycVerified ? "已认证" : "未认证"}
                  </Tag>
                )}
              </InfoItem>
            </div>
          </Card>
        </Col>

        {/* 联系方式 */}
        <Col xs={24} md={12} lg={8}>
          <Card title="联系方式" size="small" variant="outlined" style={{ height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <InfoItem icon={<MailOutlined />} label="绑定邮箱">
                {maskEmail(user?.email)}
              </InfoItem>
            </div>
          </Card>
        </Col>

        {/* 最近登录 */}
        <Col xs={24} md={12} lg={8}>
          <Card title="最近登录" size="small" variant="outlined" style={{ height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <InfoItem icon={<ClockCircleOutlined />} label="最后登录时间">
                {formatDate(user?.last_login_at)}
              </InfoItem>

              <InfoItem icon={<GlobalOutlined />} label="最后登录 IP">
                {user?.last_login_ip ?? "—"}
              </InfoItem>
            </div>
          </Card>
        </Col>
      </Row>

      {isMobile && <div style={{ height: 16 }} />}
    </AppLayout>
  );
}