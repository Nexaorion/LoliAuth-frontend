"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Typography,
  Button,
  Descriptions,
  Tag,
  App,
  Spin,
  QRCode,
  Alert,
  Space,
  Modal,
  Checkbox,
} from "antd";
import {
  SafetyCertificateOutlined,
  LoadingOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import AppLayout from "@/components/layout/AppLayout";
import { startKyc, verifyKyc, getKycStatus } from "@/lib/api/kyc";
import type { KycStatus } from "@/types";
import type { AxiosError } from "axios";
import type { ApiError } from "@/types";

const { Title, Text, Link } = Typography;

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
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [h5Url, setH5Url] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [pollResult, setPollResult] = useState<"idle" | "polling" | "success" | "failed">("idle");
  const [failReason, setFailReason] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeCheckedRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setIsMobile(mq.matches || navigator.maxTouchPoints > 0);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getKycStatus();
      setStatus(s);
      return s;
    } catch {
      message.error("加载 KYC 数据失败");
      return null;
    } finally {
      setLoading(false);
    }
  }, [message]);

  // 后台静默刷新，不触发全页 loading（避免 Modal 被销毁）
  const refreshData = useCallback(async () => {
    try {
      const s = await getKycStatus();
      setStatus(s);
      return s;
    } catch {
      return null;
    }
  }, []);

  const openVerifyModal = useCallback(
    (url: string) => {
      setH5Url(url);
      setModalOpen(true);
      setPollResult("polling");
      setFailReason(null);
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
    setFailReason(null);
  }, []);

  const onVerifySuccess = useCallback(() => {
    clearKycSession();
    closeVerifyModal();
    message.success("实名认证成功！");
    refreshData();
  }, [closeVerifyModal, message, refreshData]);

  const onVerifyFailed = useCallback((reason?: string) => {
    clearKycSession();
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setPolling(false);
    setPollResult("failed");
    setFailReason(reason || null);
    refreshData();
  }, [refreshData]);

  const doPoll = useCallback(
    async () => {
      try {
        const record = await verifyKyc();
        if (record.status === "success") {
          onVerifySuccess();
        } else if (record.status === "failed" || record.status === "expired") {
          onVerifyFailed(record.fail_reason);
        }
        // pending → 继续轮询
      } catch {
        // 网络异常或 404 不视为失败，继续轮询
      }
    },
    [onVerifySuccess, onVerifyFailed]
  );

  useEffect(() => {
    if (polling) {
      if (pollingRef.current) clearInterval(pollingRef.current);

      // 不立即轮询：给用户留出扫码时间，避兎后端还没收到百度回调就返回 failed
      pollingRef.current = setInterval(() => {
        doPoll();
      }, POLL_INTERVAL);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [polling, doPoll]);
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
              openVerifyModal(saved.h5Url);
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
      openVerifyModal(res.h5_url);
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

  const handleStartClick = () => {
    setPrivacyAgreed(false);
    setConfirmModalOpen(true);
  };

  const handleConfirmStart = () => {
    setConfirmModalOpen(false);
    handleStart();
  };

  const handleModalClose = () => {
    // Don't clear session — user may come back later
    closeVerifyModal();
  };

  const [remainingTimeStr, setRemainingTimeStr] = useState<string | null>(null);
  useEffect(() => {
    if (!modalOpen) {
      setRemainingTimeStr(null);
      return;
    }
    const update = () => {
      const saved = loadKycSession();
      if (!saved) { setRemainingTimeStr(null); return; }
      const remaining = KYC_SESSION_MAX_AGE - (Date.now() - saved.createdAt);
      if (remaining <= 0) { setRemainingTimeStr(null); return; }
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      setRemainingTimeStr(`${hours} 小时 ${minutes} 分钟 ${seconds} 秒`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [modalOpen]);

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
          {status.status === "failed" && status.fail_reason && (
            <Descriptions.Item label="失败原因">
              {status.fail_reason}
            </Descriptions.Item>
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
                onClick={handleStartClick}
              >
                开始认证
              </Button>
            )}
          </Space>
        )}

      <Modal
        title={
          <Space>
            <InfoCircleOutlined style={{ color: "#1677ff" }} />
            是否确认开始实名认证?
          </Space>
        }
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        onOk={handleConfirmStart}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ disabled: !privacyAgreed, loading: starting }}
        width={480}
      >
        <p style={{ marginBottom: 16 }}>
          您即将开始 LoliAuth 统一认证系统的实名认证流程，北京百度网讯科技有限公司将为您提供实名认证核验服务。
        </p>
        <Checkbox
          checked={privacyAgreed}
          onChange={(e) => setPrivacyAgreed(e.target.checked)}
        >
          我已阅读并同意
          <Link
            href="https://ai.baidu.com/ai-doc/FACE/wmimjmo95#h5%E5%AE%9E%E5%90%8D%E8%AE%A4%E8%AF%81%E7%94%A8%E6%88%B7%E9%9A%90%E7%A7%81%E5%8D%8F%E8%AE%AE"
            target="_blank"
            onClick={(e) => e.stopPropagation()}
          >
            《H5实名认证用户隐私协议》
          </Link>
        </Checkbox>
      </Modal>

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
                ...(status && status.attempts_remaining > 0
                  ? [
                      <Button
                        key="retry"
                        type="primary"
                        onClick={() => {
                          closeVerifyModal();
                          handleStartClick();
                        }}
                      >
                        重新认证
                      </Button>,
                    ]
                  : []),
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
              {failReason
                ? failReason
                : status && status.attempts_remaining > 0
                  ? "本次认证未通过，您可以重新发起认证。"
                  : "本次认证未通过，认证次数已用完，如需重试请联系管理员。"}
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
            {h5Url && (
              <QRCode value={h5Url} size={240} style={{ margin: "0 auto" }} />
            )}
            <div style={{ marginTop: 16 }}>
              <Space direction="vertical" align="center" size="small">
                <Text>
                  {isMobile
                    ? "请扫描二维码或点击下方按钮完成认证"
                    : "请使用手机扫描二维码完成认证"}
                </Text>
                {isMobile && h5Url && (
                  <Button
                    type="primary"
                    icon={<LinkOutlined />}
                    onClick={() => window.open(h5Url, "_blank", "noopener,noreferrer")}
                  >
                    在新标签页打开链接
                  </Button>
                )}
                <Space size="small">
                  <LoadingOutlined spin />
                  <Text type="secondary">正在等待认证结果...</Text>
                </Space>
                {remainingTimeStr && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    剩余有效时间：{remainingTimeStr}
                  </Text>
                )}
              </Space>
            </div>
          </div>
        )}
      </Modal>

    </AppLayout>
  );
}
