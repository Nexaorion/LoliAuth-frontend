"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Layout, Menu, theme, Spin, Button, Drawer, Grid, Watermark } from "antd";
import {
  UserOutlined,
  AppstoreOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
  MenuOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useAuthStore } from "@/stores/authStore";
import { getDeviceFingerprint } from "@/lib/device-sign";

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "LoliAuth";

const siderItems: MenuProps["items"] = [
  { key: "/admin/users", icon: <UserOutlined />, label: "用户管理" },
  { key: "/admin/clients", icon: <AppstoreOutlined />, label: "应用管理" },
  {
    key: "/admin/kyc",
    icon: <SafetyCertificateOutlined />,
    label: "KYC 管理",
  },
  {
    key: "/admin/audit-logs",
    icon: <FileTextOutlined />,
    label: "审计日志",
  },
  { type: "divider" as const },
  { key: "/profile", icon: <ArrowLeftOutlined />, label: "返回前台" },
];

function formatTime(d: Date) {
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function AdminLayout({ children }: React.PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hydrate, loadProfile, loading } = useAuthStore();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userCollapsed, setUserCollapsed] = useState<boolean | null>(null);
  const [loginTime] = useState(() => formatTime(new Date()));
  const [fingerprint] = useState(() => getDeviceFingerprint());
  const screens = useBreakpoint();

  const isMobile = screens.md === false;
  const isTablet = screens.md === true && screens.lg === false;

  // Derive effective collapsed: honour manual toggle; otherwise auto-collapse on tablet
  const collapsed = userCollapsed !== null ? userCollapsed : isTablet;

  useEffect(() => {
    hydrate();
    loadProfile().finally(() => setReady(true));
  }, [hydrate, loadProfile]);

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    router.push(key);
    setDrawerOpen(false);
  };

  const selectedKey =
    siderItems
      ?.filter((item) => item && "key" in item)
      .map((item) => (item as { key: string }).key)
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

  const menuContent = (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      items={siderItems}
      onClick={handleMenuClick}
      style={{ border: "none" }}
    />
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Desktop / Tablet sidebar */}
      {!isMobile && (
        <Sider
          width={220}
          collapsedWidth={64}
          collapsed={collapsed}
          style={{
            background: colorBgContainer,
            borderRight: "1px solid #f0f0f0",
            overflow: "hidden auto",
            height: "100vh",
            position: "sticky",
            insetInlineStart: 0,
            top: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Brand / collapse toggle */}
          <div
            style={{
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "space-between",
              padding: collapsed ? "0 20px" : "0 12px 0 20px",
              borderBottom: "1px solid #f0f0f0",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {!collapsed && (
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                管理后台
              </span>
            )}
            <Button
              type="text"
              size="small"
              icon={
                collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
              }
              onClick={() => setUserCollapsed((c) => !(c !== null ? c : isTablet))}
              style={{ color: "#8c8c8c", flexShrink: 0 }}
            />
          </div>
          {menuContent}
        </Sider>
      )}

      {/* Mobile Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="left"
        width={240}
        title={<span style={{ fontWeight: 700 }}>{APP_NAME} · 管理后台</span>}
        styles={{ body: { padding: 0 } }}
      >
        {menuContent}
      </Drawer>

      <Watermark
        content={[
          user?.email?.split("@")[0] ?? "",
          user?.email ?? "",
          loginTime,
          fingerprint,
        ]}
        font={{ fontSize: 12, color: "rgba(0,0,0,0.08)" }}
        gap={[180, 120]}
        rotate={-22}
        style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column" }}
      >
      <Layout style={{ minWidth: 0 }}>
        {isMobile && (
          <div
            style={{
              height: 56,
              padding: "0 16px",
              background: colorBgContainer,
              borderBottom: "1px solid #f0f0f0",
              display: "flex",
              alignItems: "center",
              gap: 12,
              position: "sticky",
              top: 0,
              zIndex: 10,
              flexShrink: 0,
            }}
          >
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setDrawerOpen(true)}
            />
            <span style={{ fontWeight: 700, fontSize: 16 }}>管理后台</span>
          </div>
        )}

        <Content
          style={{
            margin: isMobile ? 12 : 24,
            padding: isMobile ? 16 : 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
            minWidth: 0,
          }}
        >
          {children}
        </Content>
      </Layout>
      </Watermark>
    </Layout>
  );
}
