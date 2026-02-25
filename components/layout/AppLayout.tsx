"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Layout, Menu, Dropdown, Avatar, theme, Spin } from "antd";
import {
  UserOutlined,
  AppstoreOutlined,
  SafetyCertificateOutlined,
  LogoutOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useAuthStore } from "@/stores/authStore";

const { Header, Content } = Layout;

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "LoliAuth";

const navItems: MenuProps["items"] = [
  { key: "/profile", icon: <UserOutlined />, label: "个人信息" },
  { key: "/developer/apps", icon: <AppstoreOutlined />, label: "应用管理" },
  { key: "/kyc", icon: <SafetyCertificateOutlined />, label: "实名认证" },
];

export default function AppLayout({ children }: React.PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, loading, hydrate, loadProfile, logout } =
    useAuthStore();
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate();
    loadProfile().finally(() => setReady(true));
  }, [hydrate, loadProfile]);

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    router.push(key);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const userMenuItems: MenuProps["items"] = [
    { key: "email", label: user?.email ?? "—", disabled: true },
    ...(isAdmin
      ? [
          { type: "divider" as const },
          {
            key: "/admin/users",
            icon: <DashboardOutlined />,
            label: "管理后台",
          },
        ]
      : []),
    { type: "divider" as const },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      danger: true,
      onClick: handleLogout,
    },
  ];

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
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Avatar
            icon={<UserOutlined />}
            style={{ cursor: "pointer", marginLeft: 16 }}
          />
        </Dropdown>
      </Header>
      <Content style={{ padding: "24px 24px 48px", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
        {children}
      </Content>
    </Layout>
  );
}
