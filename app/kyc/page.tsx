"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Typography,
  Button,
  Descriptions,
  Table,
  Tag,
  App,
  Spin,
  QRCode,
  Alert,
  Space,
  Modal,
} from "antd";
import {
  SafetyCertificateOutlined,
  LoadingOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AppLayout from "@/components/layout/AppLayout";
import { startKyc, queryKyc, getKycStatus, getKycRecords } from "@/lib/api/kyc";
import type { KycStatus, KycRecord } from "@/types";
import type { AxiosError } from "axios";
import type { ApiError } from "@/types";

const { Title, Text } = Typography;

const KYC_SESSION_KEY = "kyc_session";
const KYC_SESSION_MAX_AGE = 3 * 24 * 60 * 60 * 1000;
const POLL_INTERVAL = 5000;

interface KycSession {
  verifyToken: string;
  h5Url: string;
  createdAt: number; // unix timestamp in ms
}

function saveKycSession(session: KycSession) {
  try {
    localStorage.setItem(KYC_SESSION_KEY, JSON.stringify(session));
  } catch {
    // localStorage may be unavailable
  }
}

function loadKycSession(): KycSession | null {
  try {
    const raw = localStorage.getItem(KYC_SESSION_KEY);
    if (!raw) return null;
    const session: KycSession = JSON.parse(raw);
    // Check 3-day expiry
    if (Date.now() - session.createdAt > KYC_SESSION_MAX_AGE) {
      localStorage.removeItem(KYC_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function clearKycSession() {
  try {
    localStorage.removeItem(KYC_SESSION_KEY);
  } catch {
    // ignore
  }
}

const statusConfig: Record<
  string,
  { color: string; text: string; icon?: React.ReactNode }
> = {
  none: { color: "default", text: "未认证" },
  pending: { color: "processing", text: "认证中" },
  success: {
    color: "success",
    text: "已认证",
    icon: <CheckCircleFilled />,
  },
  failed: { color: "error", text: "认证失败", icon: <CloseCircleFilled /> },
  expired: { color: "warning", text: "已过期" },
};

export default function KycPage() {
  const { message, modal } = App.useApp();
  const [status, setStatus] = useState<KycStatus | null>(null);
  const [records, setRecords] = useState<KycRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [h5Url, setH5Url] = useState<string | null>(null);
  const [verifyToken, setVerifyToken] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [pollResult, setPollResult] = useState<"idle" | "polling" | "success" | "failed">("idle");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeCheckedRef = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([getKycStatus(), getKycRecords()]);
      setStatus(s);
      setRecords(r);
      return s;
    } catch {
      message.error("加载 KYC 数据失败");
      return null;
    } finally {
      setLoading(false);
    }
  }, [message]);

  const openVerifyModal = useCallback(
    (url: string, token: string) => {
      setH5Url(url);
      setVerifyToken(token);
      setModalOpen(true);
      setPollResult("polling");
      setPolling(true);
    },
    []
  );

  const closeVerifyModal = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setPolling(false);
    setModalOpen(false);
    setPollResult("idle");
  }, []);

  const onVerifySuccess = useCallback(() => {
    clearKycSession();
    closeVerifyModal();
    message.success("实名认证成功！");
    fetchData();
  }, [closeVerifyModal, message, fetchData]);

  const onVerifyFailed = useCallback(() => {
    clearKycSession();
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setPolling(false);
    setPollResult("failed");
    fetchData();
  }, [fetchData]);

  const doPoll = useCallback(
    async (token: string) => {
      try {
        const record = await queryKyc(token);
        if (record.status === "success") {
          onVerifySuccess();
        } else if (record.status === "failed") {
          onVerifyFailed();
        }
      } catch {
      }
    },
    [onVerifySuccess, onVerifyFailed]
  );

  useEffect(() => {
    if (polling && verifyToken) {
      if (pollingRef.current) clearInterval(pollingRef.current);

      doPoll(verifyToken);

      pollingRef.current = setInterval(() => {
        doPoll(verifyToken);
      }, POLL_INTERVAL);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [polling, verifyToken, doPoll]);
  useEffect(() => {
    fetchData().then((kycStatus) => {
      if (resumeCheckedRef.current) return;
      resumeCheckedRef.current = true;
      if (
        kycStatus &&
        (kycStatus.status === "none" ||
          kycStatus.status === "failed" ||
          kycStatus.status === "expired" ||
          kycStatus.status === "pending")
      ) {
        const saved = loadKycSession();
        if (saved) {
          modal.confirm({
            title: "当前存在未完成的认证",
            icon: <ExclamationCircleOutlined />,
            content: `您在 ${new Date(saved.createdAt).toLocaleString("zh-CN")} 发起了一次认证，是否继续完成？认证需在三天内完成。`,
            okText: "继续认证",
            cancelText: "放弃",
            onOk() {
              openVerifyModal(saved.h5Url, saved.verifyToken);
            },
            onCancel() {
              clearKycSession();
            },
          });
        }
      } else {
        clearKycSession();
      }
    });
  }, []);

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await startKyc();
      const session: KycSession = {
        verifyToken: res.verify_token,
        h5Url: res.h5_url,
        createdAt: Date.now(),
      };
      saveKycSession(session);
      openVerifyModal(res.h5_url, res.verify_token);
      message.info("请使用手机扫描二维码完成认证");
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const errCode = axiosErr.response?.data?.error;
      if (errCode === "already_verified") {
        message.warning("您已通过实名认证");
        clearKycSession();
        fetchData();
      } else if (errCode === "no_attempts") {
        message.error("认证次数已用完");
      } else {
        message.error("发起认证失败");
      }
    } finally {
      setStarting(false);
    }
  };

  const handleModalClose = () => {
    // Don't clear session — user may come back later
    closeVerifyModal();
  };

  const remainingTime = useCallback(() => {
    const saved = loadKycSession();
    if (!saved) return null;
    const remaining = KYC_SESSION_MAX_AGE - (Date.now() - saved.createdAt);
    if (remaining <= 0) return null;
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} 小时 ${minutes} 分钟`;
  }, []);

  const recordColumns: ColumnsType<KycRecord> = [
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (s: string) => {
        const cfg = statusConfig[s] || { color: "default", text: s };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    { title: "姓名", dataIndex: "id_name", key: "id_name", render: (v: string) => v || "—" },
    {
      title: "身份证号",
      dataIndex: "id_number",
      key: "id_number",
      render: (v: string) => v || "—",
    },
    {
      title: "分数",
      dataIndex: "score",
      key: "score",
      render: (v: number) => (v != null ? v.toFixed(2) : "—"),
    },
    {
      title: "时间",
      dataIndex: "created_at",
      key: "created_at",
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div style={{ textAlign: "center", padding: 80 }}>
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

  const cfg = status ? statusConfig[status.status] : null;

  return (
    <AppLayout>
      <Title level={3}>实名认证</Title>

      {status && (
        <Descriptions bordered column={1} style={{ marginTop: 16 }}>
          <Descriptions.Item label="认证状态">
            {cfg && (
              <Tag color={cfg.color} icon={cfg.icon}>
                {cfg.text}
              </Tag>
            )}
          </Descriptions.Item>
          {status.status === "success" && (
            <>
              <Descriptions.Item label="姓名">
                {status.id_name || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="身份证号">
                {status.id_number || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="认证时间">
                {status.verified_at
                  ? new Date(status.verified_at).toLocaleString("zh-CN")
                  : "—"}
              </Descriptions.Item>
            </>
          )}
          <Descriptions.Item label="剩余认证次数">
            {status.attempts_remaining}
          </Descriptions.Item>
        </Descriptions>
      )}

      {status &&
        (status.status === "none" || status.status === "failed" || status.status === "expired") && (
          <Space direction="vertical" style={{ marginTop: 24, width: "100%" }}>
            {status.attempts_remaining <= 0 && (
              <Alert
                message="认证次数已用完，如需重新认证请联系管理员"
                type="warning"
                showIcon
              />
            )}
            {status.attempts_remaining > 0 && (
              <Button
                type="primary"
                icon={<SafetyCertificateOutlined />}
                loading={starting}
                onClick={handleStart}
              >
                开始认证
              </Button>
            )}
          </Space>
        )}

      <Modal
        title="实名认证"
        open={modalOpen}
        onCancel={handleModalClose}
        footer={
          pollResult === "failed"
            ? [
                <Button key="close" onClick={handleModalClose}>
                  关闭
                </Button>,
                <Button
                  key="retry"
                  type="primary"
                  onClick={() => {
                    closeVerifyModal();
                    handleStart();
                  }}
                >
                  重新认证
                </Button>,
              ]
            : [
                <Button key="close" onClick={handleModalClose}>
                  稍后继续
                </Button>,
              ]
        }
        destroyOnClose
        maskClosable={false}
        width={400}
      >
        {pollResult === "failed" ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <CloseCircleFilled style={{ fontSize: 48, color: "#ff4d4f" }} />
            <Title level={4} style={{ marginTop: 16 }}>
              认证失败
            </Title>
            <Text type="secondary">
              本次认证未通过，您可以重新发起认证。
            </Text>
          </div>
        ) : pollResult === "success" ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <CheckCircleFilled style={{ fontSize: 48, color: "#52c41a" }} />
            <Title level={4} style={{ marginTop: 16 }}>
              认证成功
            </Title>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            {h5Url && <QRCode value={h5Url} size={240} style={{ margin: "0 auto" }} />}
            <div style={{ marginTop: 16 }}>
              <Space direction="vertical" align="center" size="small">
                <Text>请使用手机扫描二维码完成认证</Text>
                <Space size="small">
                  <LoadingOutlined spin />
                  <Text type="secondary">正在等待认证结果...</Text>
                </Space>
                {remainingTime() && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    剩余有效时间：{remainingTime()}
                  </Text>
                )}
              </Space>
            </div>
          </div>
        )}
      </Modal>

      <Title level={4} style={{ marginTop: 32 }}>
        认证记录
      </Title>
      <Table
        columns={recordColumns}
        dataSource={records}
        rowKey="id"
        pagination={false}
        style={{ marginTop: 8 }}
      />
    </AppLayout>
  );
}
