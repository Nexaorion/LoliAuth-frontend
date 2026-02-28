"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Layout, Menu, theme, Spin, Button, Drawer, Grid } from "antd";
import {
  AppstoreOutlined,
  DashboardOutlined,
  FileTextOutlined,
  UnorderedListOutlined,
  CreditCardOutlined,
  BookOutlined,
  ArrowLeftOutlined,
  MenuOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useAuthStore } from "@/stores/authStore";

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const siderItems: MenuProps["items"] = [
  {
    key: "/developer/apps",
    icon: <AppstoreOutlined />,
    label: "我的应用",
  },
  {
    key: "payment",
    icon: <CreditCardOutlined />,
    label: "支付功能",
    children: [
      {
        key: "/developer/billing/dashboard",
        icon: <DashboardOutlined />,
        label: "看板",
      },
      {
        key: "/developer/billing/orders",
        icon: <FileTextOutlined />,
        label: "订单管理",
      },
      {
        key: "/developer/billing/subscriptions",
        icon: <UnorderedListOutlined />,
        label: "订阅管理",
      },
      {
        key: "/developer/billing/guide",
        icon: <BookOutlined />,
        label: "接入说明",
      },
    ],
  },
  { type: "divider" as const },
  { key: "/profile", icon: <ArrowLeftOutlined />, label: "返回前台" },
];

export default function DeveloperLayout({
  children,
}: React.PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const { hydrate, loadProfile, loading } = useAuthStore();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userCollapsed, setUserCollapsed] = useState<boolean | null>(null);
  const screens = useBreakpoint();

  const isMobile = screens.md === false;
  const isTablet = screens.md === true && screens.lg === false;
  const collapsed = userCollapsed !== null ? userCollapsed : isTablet;

  useEffect(() => {
    hydrate();
    loadProfile().finally(() => setReady(true));
  }, [hydrate, loadProfile]);

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    router.push(key);
    setDrawerOpen(false);
  };

  const flatKeys: string[] = [];
  const extractKeys = (items: MenuProps["items"]) => {
    items?.forEach((item) => {
      if (item && "key" in item && typeof item.key === "string") {
        flatKeys.push(item.key);
      }
      if (item && "children" in item && item.children) {
        extractKeys(item.children as MenuProps["items"]);
      }
    });
  };
  extractKeys(siderItems);

  const selectedKey =
    flatKeys.find((key) => pathname.startsWith(key)) ?? "";

  const defaultOpenKeys: string[] = [];
  if (pathname.startsWith("/developer/billing")) {
    defaultOpenKeys.push("payment");
  }

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
      defaultOpenKeys={defaultOpenKeys}
      items={siderItems}
      onClick={handleMenuClick}
      style={{ border: "none" }}
    />
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
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
                开发者中心
              </span>
            )}
            <Button
              type="text"
              size="small"
              icon={
                collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
              }
              onClick={() =>
                setUserCollapsed((c) => !(c !== null ? c : isTablet))
              }
              style={{ color: "#8c8c8c", flexShrink: 0 }}
            />
          </div>
          {menuContent}
        </Sider>
      )}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="left"
        width={240}
        title={<span style={{ fontWeight: 700 }}>开发者中心</span>}
        styles={{ body: { padding: 0 } }}
      >
        {menuContent}
      </Drawer>

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
            <span style={{ fontWeight: 700, fontSize: 16 }}>开发者中心</span>
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
    </Layout>
  );
}
