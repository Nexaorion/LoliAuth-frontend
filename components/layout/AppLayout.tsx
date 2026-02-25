"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Layout,
  Menu,
  Popover,
  Avatar,
  theme,
  Spin,
  Button,
  Typography,
  Tag,
  Space,
  Tooltip,
  Divider,
} from "antd";
import {
  UserOutlined,
  AppstoreOutlined,
  SafetyCertificateOutlined,
  LogoutOutlined,
  DashboardOutlined,
  CopyOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useAuthStore } from "@/stores/authStore";
import { getKycStatus } from "@/lib/api/kyc";
import type { KycStatus } from "@/types";

const { Text } = Typography;
const { Header, Content } = Layout;

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "LoliAuth";

const navItems: MenuProps["items"] = [
  { key: "/profile", icon: <UserOutlined />, label: "个人信息" },
  { key: "/developer/apps", icon: <AppstoreOutlined />, label: "应用管理" },
  { key: "/kyc", icon: <SafetyCertificateOutlined />, label: "实名认证" },
];

function truncateId(id: string) {
  return id.length > 15 ? id.slice(0, 15) + "…" : id;
}

function displayName(email?: string) {
  if (!email) return "用户";
  return email.split("@")[0];
}

function avatarLetter(email?: string) {
  if (!email) return "U";
  return email[0].toUpperCase();
}

export default function AppLayout({ children }: React.PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, loading, hydrate, loadProfile, logout } =
    useAuthStore();
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const [ready, setReady] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);

  const fetchKycStatus = useCallback(async () => {
    try {
      const s = await getKycStatus();
      setKycStatus(s);
    } catch {
      // non-critical, ignore
    }
  }, []);

  useEffect(() => {
    hydrate();
    loadProfile().finally(() => {
      setReady(true);
      fetchKycStatus();
    });
  }, [hydrate, loadProfile, fetchKycStatus]);

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    router.push(key);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleCopyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isVerified = kycStatus?.status === "success";

  const popoverContent = (
    <div style={{ width: 220 }}>
      {/* User info */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0 12px" }}>
        <Avatar
          size={44}
          style={{ background: "#8c8c8c", flexShrink: 0, fontSize: 18, fontWeight: 600 }}
        >
          {avatarLetter(user?.email)}
        </Avatar>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, lineHeight: "22px" }}>
            {displayName(user?.email)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              账号ID：{truncateId(user?.id ?? "")}
            </Text>
            <Tooltip title={copied ? "已复制" : "复制 ID"}>
              <Button
                type="text"
                size="small"
                icon={copied ? <CheckOutlined style={{ color: "#52c41a" }} /> : <CopyOutlined />}
                onClick={handleCopyId}
                style={{ padding: 0, height: 18, width: 18, minWidth: 18, color: "#8c8c8c" }}
              />
            </Tooltip>
          </div>
        </div>
      </div>

      {/* KYC tag */}
      <div style={{ paddingBottom: 12 }}>
        <Tag color={isVerified ? "blue" : "orange"} icon={<SafetyCertificateOutlined />}>
          {isVerified ? "已实名认证" : "未实名认证"}
        </Tag>
      </div>

      {/* Admin entry */}
      {isAdmin && (
        <>
          <Divider style={{ margin: "0 0 8px" }} />
          <Button
            type="text"
            icon={<DashboardOutlined />}
            block
            style={{ textAlign: "left" }}
            onClick={() => {
              setPopoverOpen(false);
              router.push("/admin/users");
            }}
          >
            管理后台
          </Button>
        </>
      )}

      <Divider style={{ margin: "8px 0" }} />

      {/* Logout */}
      <Button
        type="text"
        icon={<LogoutOutlined />}
        danger
        block
        style={{ textAlign: "left" }}
        onClick={() => {
          setPopoverOpen(false);
          handleLogout();
        }}
      >
        退出
      </Button>
    </div>
  );

  // Compute selected nav key
  const selectedKey =
    navItems
      ?.map((item) => (item as { key: string }).key)
      .find((key) => pathname.startsWith(key)) ?? "";

  if (!ready || loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          background: colorBgContainer,
          borderBottom: "1px solid #f0f0f0",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 18,
            marginRight: 32,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
          onClick={() => router.push("/")}
        >
          {APP_NAME}
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={navItems}
          onClick={handleMenuClick}
          style={{ flex: 1, border: "none" }}
        />
        <Popover
          content={popoverContent}
          trigger="click"
          placement="bottomRight"
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
          arrow={false}
        >
          <Avatar
            style={{
              cursor: "pointer",
              marginLeft: 16,
              background: "#8c8c8c",
              fontWeight: 600,
            }}
          >
            {avatarLetter(user?.email)}
          </Avatar>
        </Popover>
      </Header>
      <Content style={{ padding: "24px 24px 48px", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
        {children}
      </Content>
    </Layout>
  );
}
