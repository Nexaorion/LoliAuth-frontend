"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Layout, Menu, theme, Spin } from "antd";
import {
  UserOutlined,
  AppstoreOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useAuthStore } from "@/stores/authStore";

const { Sider, Content } = Layout;

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

export default function AdminLayout({ children }: React.PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const { hydrate, loadProfile, loading } = useAuthStore();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate();
    loadProfile().finally(() => setReady(true));
  }, [hydrate, loadProfile]);

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    router.push(key);
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

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={220}
        style={{
          background: colorBgContainer,
          borderRight: "1px solid #f0f0f0",
          overflow: "auto",
          height: "100vh",
          position: "sticky",
          insetInlineStart: 0,
          top: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          管理后台
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={siderItems}
          onClick={handleMenuClick}
          style={{ border: "none" }}
        />
      </Sider>
      <Layout>
        <Content
          style={{
            padding: 24,
            margin: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
