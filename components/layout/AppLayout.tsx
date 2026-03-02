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
  Tooltip,
  Divider,
  Drawer,
  Grid,
  message,
  Modal,
} from "antd";
import md5 from "md5";
import PolicyModal from "@/components/ui/PolicyModal";
import {
  UserOutlined,
  AppstoreOutlined,
  SafetyCertificateOutlined,
  LogoutOutlined,
  DashboardOutlined,
  CopyOutlined,
  CheckOutlined,
  SecurityScanOutlined,
  MenuOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useAuthStore } from "@/stores/authStore";
import { getKycStatus } from "@/lib/api/kyc";
import { getWallet, activateWallet } from "@/lib/api/billing";
import type { KycStatus, Wallet } from "@/types";

const { Text } = Typography;
const { Header, Content } = Layout;
const { useBreakpoint } = Grid;

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "LoliAuth";

const navItems: MenuProps["items"] = [
  { key: "/profile", icon: <UserOutlined />, label: "个人信息" },
  { key: "/security", icon: <SecurityScanOutlined />, label: "安全中心" },
  { key: "/developer/apps", icon: <AppstoreOutlined />, label: "应用管理" },
];

function gravatarUrl(email?: string, size = 80): string | undefined {
  if (!email) return undefined;
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`;
}

function truncateId(id: string) {
  if (!id) return "";
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletLoaded, setWalletLoaded] = useState(false);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const [avatarInfoOpen, setAvatarInfoOpen] = useState(false);
  const screens = useBreakpoint();
  const isMobile = screens.md === false;

  const fetchKycStatus = useCallback(async () => {
    try {
      const s = await getKycStatus();
      setKycStatus(s);
    } catch {
      // non-critical, ignore
    }
  }, []);

  const fetchWallet = useCallback(async () => {
    try {
      const w = await getWallet();
      setWallet(w);
    } catch {
      setWallet(null);
    } finally {
      setWalletLoaded(true);
    }
  }, []);

  useEffect(() => {
    hydrate();
    loadProfile().finally(() => {
      setReady(true);
      fetchKycStatus();
      fetchWallet();
    });
  }, [hydrate, loadProfile, fetchKycStatus, fetchWallet]);

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

  const handleBalanceClick = () => {
    if (walletLoaded && (!wallet || !wallet.activated)) {
      setActivateModalOpen(true);
      setPopoverOpen(false);
    } else {
      setPopoverOpen(false);
      router.push("/balance");
    }
  };

  const handleActivateWallet = async () => {
    setActivating(true);
    try {
      const w = await activateWallet();
      setWallet(w);
      setActivateModalOpen(false);
      message.success("钱包开通成功");
      router.push("/balance");
    } catch {
      message.error("开通失败，请稍后再试");
    } finally {
      setActivating(false);
    }
  };

  const isVerified = kycStatus?.status === "success";

  const popoverContent = (
    <div style={{ width: 220 }}>
      {/* User info */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0 12px" }}>
        <Tooltip title="点击了解头像来源" placement="bottom">
          <Avatar
            size={44}
            src={gravatarUrl(user?.email, 88)}
            style={{ background: "#8c8c8c", flexShrink: 0, fontSize: 18, fontWeight: 600, cursor: "pointer" }}
            onClick={() => {
              setPopoverOpen(false);
              setAvatarInfoOpen(true);
            }}
          >
            {avatarLetter(user?.email)}
          </Avatar>
        </Tooltip>
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
          {isVerified ? "已认证" : "未认证"}
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

      <Button
        type="text"
        icon={<WalletOutlined />}
        block
        style={{ textAlign: "left" }}
        onClick={handleBalanceClick}
      >
        余额
        {walletLoaded && wallet?.activated && (
          <span style={{ marginLeft: 8, color: "#8c8c8c", fontSize: 12 }}>
            ${(wallet.balance / 100).toFixed(2)}
          </span>
        )}
      </Button>

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
          padding: isMobile ? "0 12px" : "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 10,
          gap: 0,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: isMobile ? 15 : 17,
            cursor: "pointer",
            whiteSpace: "nowrap",
            marginRight: isMobile ? 0 : 12,
            flexShrink: 0,
          }}
          onClick={() => router.push("/")}
        >
          {APP_NAME}
        </div>

        {!isMobile && (
          <Menu
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={navItems}
            onClick={handleMenuClick}
            style={{ flex: 1, border: "none", minWidth: 0 }}
            overflowedIndicator={<MenuOutlined />}
          />
        )}

        {/* Mobile: spacer + hamburger */}
        {isMobile && (
          <>
            <div style={{ flex: 1 }} />
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setDrawerOpen(true)}
              style={{ marginRight: 4 }}
            />
          </>
        )}

        <Popover
          content={popoverContent}
          trigger="click"
          placement="bottomRight"
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
          arrow={false}
        >
          <Avatar
            src={gravatarUrl(user?.email)}
            style={{
              cursor: "pointer",
              marginLeft: isMobile ? 0 : 8,
              background: "#8c8c8c",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {avatarLetter(user?.email)}
          </Avatar>
        </Popover>
      </Header>

      <Content
        style={{
          maxWidth: 1200,
          width: "100%",
          margin: "0 auto",
          padding: isMobile ? "20px 16px 48px" : "24px 32px 64px",
        }}
      >
        {children}
      </Content>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="left"
        width={260}
        title={APP_NAME}
        styles={{ body: { padding: 0, display: "flex", flexDirection: "column" } }}
      >
        <div style={{ padding: "16px 16px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar
              size={40}
              src={gravatarUrl(user?.email, 80)}
              style={{ background: "#8c8c8c", fontWeight: 600, flexShrink: 0 }}
            >
              {avatarLetter(user?.email)}
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {displayName(user?.email)}
              </div>
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "block",
                }}
              >
                {user?.email}
              </Text>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <Tag color={isVerified ? "blue" : "orange"} icon={<SafetyCertificateOutlined />}>
              {isVerified ? "已认证" : "未认证"}
            </Tag>
          </div>
        </div>

        <Divider style={{ margin: "0" }} />

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={navItems}
          onClick={({ key }) => {
            router.push(key);
            setDrawerOpen(false);
          }}
          style={{ border: "none", flex: 1 }}
        />

        <Divider style={{ margin: "0" }} />

        {isAdmin && (
          <Button
            type="text"
            icon={<DashboardOutlined />}
            block
            style={{ textAlign: "left", margin: "4px 0" }}
            onClick={() => {
              setDrawerOpen(false);
              router.push("/admin/users");
            }}
          >
            管理后台
          </Button>
        )}

        <Button
          type="text"
          icon={<WalletOutlined />}
          block
          style={{ textAlign: "left", margin: "4px 0" }}
          onClick={() => {
            setDrawerOpen(false);
            handleBalanceClick();
          }}
        >
          余额
          {walletLoaded && wallet?.activated && (
            <span style={{ marginLeft: 8, color: "#8c8c8c", fontSize: 12 }}>
              ${(wallet.balance / 100).toFixed(2)}
            </span>
          )}
        </Button>

        <Button
          type="text"
          icon={<LogoutOutlined />}
          danger
          block
          style={{ textAlign: "left", margin: "4px 0 8px" }}
          onClick={() => {
            setDrawerOpen(false);
            handleLogout();
          }}
        >
          退出登录
        </Button>
      </Drawer>

      <PolicyModal
        title="开通余额服务"
        open={activateModalOpen}
        policyUrl="/policies/balance-agreement.md"
        agreeText="同意并开通"
        agreeLoading={activating}
        onAgree={handleActivateWallet}
        onCancel={() => setActivateModalOpen(false)}
      />

      <Modal
        open={avatarInfoOpen}
        onCancel={() => setAvatarInfoOpen(false)}
        footer={<Button type="primary" onClick={() => setAvatarInfoOpen(false)}>知道了</Button>}
        title="头像设置"
        width={360}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Avatar size={48} src={gravatarUrl(user?.email, 96)} style={{ background: "#8c8c8c", flexShrink: 0, fontWeight: 600 }}>
              {avatarLetter(user?.email)}
            </Avatar>
            <div style={{ fontSize: 13, color: "#595959", lineHeight: "1.6" }}>
              <p style={{ margin: "0 0 8px" }}>我们使用 <a href="https://gravatar.com" target="_blank" rel="noreferrer">Gravatar</a> 提供全球通用头像服务。</p>
              <p style={{ margin: "0 0 8px" }}>如需更换头像，请前往 <a href="https://gravatar.com" target="_blank" rel="noreferrer">gravatar.com</a> 使用您的注册邮箱（<strong>{user?.email}</strong>）登录并上传头像，保存后稍等片刻即可生效。</p>
              <p style={{ margin: 0, color: "#8c8c8c" }}>若未能获取到 Gravatar 头像，系统将自动显示默认的文字头像。</p>
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
