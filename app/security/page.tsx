"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Typography,
  Card,
  Form,
  Input,
  Steps,
  Button,
  App,
  Tag,
  Spin,
  Modal,
  Divider,
  Space,
  Grid,
  List,
  Empty,
  Popconfirm,
  Tooltip,
} from "antd";
import {
  MailOutlined,
  LockOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ArrowRightOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  UsbOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useAuthStore } from "@/stores/authStore";
import {
  sendPasswordResetCode,
  resetPassword,
  sendOldEmailCode,
  sendNewEmailCode,
  changeEmail,
  getPasskeys,
  passkeyRegisterBegin,
  passkeyRegisterFinish,
  renamePasskey,
  deletePasskey,
} from "@/lib/api/account";
import { getKycStatus } from "@/lib/api/kyc";
import type { AxiosError } from "axios";
import type { ApiError, KycStatus, Passkey } from "@/types";

const { Title, Text } = Typography;

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  const prefix = local.slice(0, 2);
  const suffix = local.slice(-1);
  return `${prefix}***${suffix}@${domain}`;
}

function useCountdown() {
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const start = useCallback(() => {
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  return { countdown, start };
}

interface SecurityRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: React.ReactNode;
  action: React.ReactNode;
  last?: boolean;
}

function SecurityRow({
  icon,
  title,
  description,
  value,
  action,
  last,
}: SecurityRowProps) {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  if (isMobile) {
    return (
      <>
        <div style={{ padding: "16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "#f5f0ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#7c3aed",
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              {icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, lineHeight: "22px" }}>{title}</div>
              <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 2 }}>{description}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingLeft: 48, gap: 8 }}>
            {value != null && <div style={{ color: "#595959", fontSize: 14 }}>{value}</div>}
            <div style={{ flexShrink: 0 }}>{action}</div>
          </div>
        </div>
        {!last && <Divider style={{ margin: 0 }} />}
      </>
    );
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "20px 0",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            minWidth: 220,
          }}
        >
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#f5f0ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#7c3aed",
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {icon}
          </span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, lineHeight: "22px" }}>
              {title}
            </div>
            <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 2 }}>
              {description}
            </div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {value != null && <div style={{ color: "#595959", fontSize: 14 }}>{value}</div>}
        <div style={{ flexShrink: 0 }}>{action}</div>
      </div>
      {!last && <Divider style={{ margin: 0 }} />}
    </>
  );
}

interface EmailModalProps {
  open: boolean;
  onClose: () => void;
}

function EmailModal({ open, onClose }: EmailModalProps) {
  const { message } = App.useApp();
  const loadProfile = useAuthStore((s) => s.loadProfile);
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [sendingOldCode, setSendingOldCode] = useState(false);
  const [sendingNewCode, setSendingNewCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const oldCountdown = useCountdown();
  const [savedNewEmail, setSavedNewEmail] = useState("");

  const resetAll = useCallback(() => {
    setStep(0);
    form.resetFields();
    setSavedNewEmail("");
  }, [form]);

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleSendOldCode = async () => {
    setSendingOldCode(true);
    try {
      await sendOldEmailCode();
      message.success("验证码已发送至你的当前邮箱");
      oldCountdown.start();
      setStep(1);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      if (error.response?.status === 429) {
        message.error("发送过于频繁，请等待 60 秒后再试");
      } else {
        message.error(error.response?.data?.error_description || "发送失败，请稍后重试");
      }
    } finally {
      setSendingOldCode(false);
    }
  };

  const handleStep1 = async (values: { old_code: string; new_email: string }) => {
    setSendingNewCode(true);
    try {
      await sendNewEmailCode({ old_code: values.old_code, new_email: values.new_email });
      message.success("验证码已发送至新邮箱");
      setSavedNewEmail(values.new_email);
      setStep(2);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      const status = error.response?.status;
      if (status === 400) message.error("旧邮箱验证码无效或已过期");
      else if (status === 409) message.error("新邮箱已被注册");
      else if (status === 429) message.error("发送过于频繁，请等待 60 秒后再试");
      else message.error(error.response?.data?.error_description || "操作失败，请稍后重试");
    } finally {
      setSendingNewCode(false);
    }
  };

  const handleStep2 = async (values: { new_code: string }) => {
    setSubmitting(true);
    try {
      await changeEmail({ new_email: savedNewEmail, new_code: values.new_code });
      message.success("邮箱修改成功");
      await loadProfile();
      handleClose();
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      const status = error.response?.status;
      if (status === 400) message.error("验证码无效或已过期");
      else if (status === 409) message.error("新邮箱已被注册");
      else message.error(error.response?.data?.error_description || "操作失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <MailOutlined style={{ color: "#7c3aed" }} />
          <span>更改安全邮箱</span>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={480}
      destroyOnClose
    >
      <Steps
        current={step}
        size="small"
        style={{ margin: "20px 0 24px" }}
        items={[
          { title: "验证当前邮箱" },
          { title: "填写新邮箱" },
          { title: "验证新邮箱" },
        ]}
      />

      {step === 0 && (
        <div>
          <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
            为保障账户安全，更改邮箱需先验证你的当前邮箱。点击下方按钮发送验证码。
          </Text>
          <Button
            type="primary"
            loading={sendingOldCode}
            disabled={oldCountdown.countdown > 0}
            onClick={handleSendOldCode}
            icon={<MailOutlined />}
            block
          >
            {oldCountdown.countdown > 0
              ? `${oldCountdown.countdown} 秒后可重发`
              : "发送验证码到当前邮箱"}
          </Button>
        </div>
      )}

      {step === 1 && (
        <Form form={form} layout="vertical" onFinish={handleStep1} requiredMark={false}>
          <Form.Item
            name="old_code"
            label="当前邮箱验证码"
            rules={[
              { required: true, message: "请输入验证码" },
              { pattern: /^\d{6}$/, message: "验证码为 6 位数字" },
            ]}
          >
            <Input
              placeholder="请输入 6 位验证码"
              maxLength={6}
              suffix={
                <Button
                  type="link"
                  size="small"
                  disabled={oldCountdown.countdown > 0}
                  loading={sendingOldCode}
                  onClick={handleSendOldCode}
                  style={{ padding: 0 }}
                >
                  {oldCountdown.countdown > 0 ? `${oldCountdown.countdown}s` : "重新发送"}
                </Button>
              }
            />
          </Form.Item>
          <Form.Item
            name="new_email"
            label="新邮箱地址"
            rules={[
              { required: true, message: "请输入新邮箱" },
              { type: "email", message: "请输入有效的邮箱地址" },
            ]}
          >
            <Input prefix={<MailOutlined style={{ color: "#bfbfbf" }} />} placeholder="请输入新的邮箱地址" />
          </Form.Item>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={handleClose}>取消</Button>
            <Button type="primary" htmlType="submit" loading={sendingNewCode}>
              下一步
            </Button>
          </Space>
        </Form>
      )}

      {step === 2 && (
        <Form layout="vertical" onFinish={handleStep2} requiredMark={false}>
          <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
            验证码已发送至 <Text strong>{savedNewEmail}</Text>，请查收邮件。
          </Text>
          <Form.Item
            name="new_code"
            label="新邮箱验证码"
            rules={[
              { required: true, message: "请输入验证码" },
              { pattern: /^\d{6}$/, message: "验证码为 6 位数字" },
            ]}
          >
            <Input placeholder="请输入 6 位验证码" maxLength={6} />
          </Form.Item>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={() => setStep(1)}>上一步</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              确认更改
            </Button>
          </Space>
        </Form>
      )}
    </Modal>
  );
}


interface PasswordModalProps {
  open: boolean;
  onClose: () => void;
}

function PasswordModal({ open, onClose }: PasswordModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { countdown, start: startCountdown } = useCountdown();

  const handleClose = () => {
    setStep(0);
    form.resetFields();
    onClose();
  };

  const handleSendCode = async () => {
    setSendingCode(true);
    try {
      await sendPasswordResetCode();
      message.success("验证码已发送至你的邮箱");
      startCountdown();
      setStep(1);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      if (error.response?.status === 429) message.error("发送过于频繁，请等待 60 秒后再试");
      else message.error(error.response?.data?.error_description || "发送失败，请稍后重试");
    } finally {
      setSendingCode(false);
    }
  };

  const onFinish = async (values: { verify_code: string; new_password: string }) => {
    setSubmitting(true);
    try {
      await resetPassword({ verify_code: values.verify_code, new_password: values.new_password });
      message.success("密码修改成功");
      handleClose();
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      if (error.response?.status === 400) message.error("验证码无效或已过期，请重新发送");
      else message.error(error.response?.data?.error_description || "重置失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <KeyOutlined style={{ color: "#7c3aed" }} />
          <span>修改登录密码</span>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={480}
      destroyOnClose
    >
      <Steps
        current={step}
        size="small"
        style={{ margin: "20px 0 24px" }}
        items={[{ title: "验证邮箱" }, { title: "设置新密码" }]}
      />

      {step === 0 && (
        <div>
          <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
            修改密码前需验证你的邮箱。点击下方按钮，我们将向你的注册邮箱发送验证码。
          </Text>
          <Button
            type="primary"
            loading={sendingCode}
            disabled={countdown > 0}
            onClick={handleSendCode}
            icon={<MailOutlined />}
            block
          >
            {countdown > 0 ? `${countdown} 秒后可重发` : "发送验证码"}
          </Button>
        </div>
      )}

      {step === 1 && (
        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="verify_code"
            label="邮箱验证码"
            rules={[
              { required: true, message: "请输入验证码" },
              { pattern: /^\d{6}$/, message: "验证码为 6 位数字" },
            ]}
          >
            <Input
              placeholder="请输入 6 位验证码"
              maxLength={6}
              suffix={
                <Button
                  type="link"
                  size="small"
                  disabled={countdown > 0}
                  loading={sendingCode}
                  onClick={handleSendCode}
                  style={{ padding: 0 }}
                >
                  {countdown > 0 ? `${countdown}s` : "重新发送"}
                </Button>
              }
            />
          </Form.Item>
          <Form.Item
            name="new_password"
            label="新密码"
            rules={[
              { required: true, message: "请输入新密码" },
              { min: 8, message: "密码至少需要 8 个字符" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="请输入新密码（至少 8 位）"
            />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label="确认新密码"
            dependencies={["new_password"]}
            rules={[
              { required: true, message: "请再次输入新密码" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("new_password") === value) return Promise.resolve();
                  return Promise.reject(new Error("两次输入的密码不一致"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="请再次输入新密码"
            />
          </Form.Item>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={handleClose}>取消</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              确认修改
            </Button>
          </Space>
        </Form>
      )}
    </Modal>
  );
}

const kycStatusConfig: Record<string, { color: string; text: string; icon?: React.ReactNode }> = {
  none: { color: "default", text: "未认证" },
  pending: { color: "processing", text: "认证中" },
  success: { color: "success", text: "已认证", icon: <CheckCircleFilled /> },
  failed: { color: "error", text: "认证失败", icon: <CloseCircleFilled /> },
  expired: { color: "warning", text: "已过期", icon: <ExclamationCircleOutlined /> },
};

interface KycModalProps {
  open: boolean;
  onClose: () => void;
  kycStatus: KycStatus | null;
}

function KycModal({ open, onClose, kycStatus }: KycModalProps) {
  const router = useRouter();
  const status = kycStatus?.status ?? "none";
  const config = kycStatusConfig[status] ?? kycStatusConfig.none;

  return (
    <Modal
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: "#7c3aed" }} />
          <span>实名认证详情</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
    >
      <div style={{ padding: "16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span style={{ color: "#8c8c8c", minWidth: 80 }}>认证状态</span>
          <Tag color={config.color} icon={config.icon} style={{ margin: 0 }}>
            {config.text}
          </Tag>
        </div>

        {status === "success" && (
          <>
            {kycStatus?.id_name && (
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <span style={{ color: "#8c8c8c", minWidth: 80 }}>实名姓名</span>
                <span style={{ fontWeight: 500 }}>{kycStatus.id_name}</span>
              </div>
            )}
            {kycStatus?.id_number && (
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <span style={{ color: "#8c8c8c", minWidth: 80 }}>身份证号</span>
                <span style={{ fontWeight: 500 }}>{kycStatus.id_number}</span>
              </div>
            )}
            {kycStatus?.verified_at && (
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <span style={{ color: "#8c8c8c", minWidth: 80 }}>认证时间</span>
                <span>{new Date(kycStatus.verified_at).toLocaleString("zh-CN")}</span>
              </div>
            )}
          </>
        )}

        {status === "failed" && kycStatus?.fail_reason && (
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <span style={{ color: "#8c8c8c", minWidth: 80 }}>失败原因</span>
            <Text type="danger">{kycStatus.fail_reason}</Text>
          </div>
        )}

        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <span style={{ color: "#8c8c8c", minWidth: 80 }}>剩余次数</span>
          <span>{kycStatus?.attempts_remaining ?? "—"} 次</span>
        </div>

        <Divider style={{ margin: "0 0 16px" }} />

        <Text type="secondary" style={{ display: "block", marginBottom: 16, fontSize: 13 }}>
          {status === "success"
            ? "你已完成实名认证。第三方应用可在你授权时获取姓名和身份证信息。"
            : "完成实名认证后，第三方应用可在你授权时获取真实姓名和身份证信息。"}
        </Text>

        {status !== "success" && (
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            onClick={() => {
              onClose();
              router.push("/kyc");
            }}
            block
          >
            前往完成实名认证
          </Button>
        )}
      </div>
    </Modal>
  );
}

export default function SecurityPage() {
  const user = useAuthStore((s) => s.user);
  const { message } = App.useApp();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [kycLoading, setKycLoading] = useState(true);

  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [passkeysLoading, setPasskeysLoading] = useState(true);
  const [passkeyRegistering, setPasskeyRegistering] = useState(false);
  const [renameModalPasskey, setRenameModalPasskey] = useState<Passkey | null>(null);
  const [renameForm] = Form.useForm();
  const [renameLoading, setRenameLoading] = useState(false);

  const fetchPasskeys = useCallback(async () => {
    try {
      const list = await getPasskeys();
      setPasskeys(list);
    } catch {
      // silently fail
    } finally {
      setPasskeysLoading(false);
    }
  }, []);

  useEffect(() => {
    getKycStatus()
      .then(setKycStatus)
      .catch(() => {})
      .finally(() => setKycLoading(false));
    fetchPasskeys();
  }, [fetchPasskeys]);

  const handleAddPasskey = async () => {
    setPasskeyRegistering(true);
    try {
      const { decodeCreationOptions, serializeCreationCredential, extractChallenge } = await import("@/lib/webauthn");
      const options = await passkeyRegisterBegin();
      const challenge = extractChallenge(options);
      void challenge;
      const decodedOptions = decodeCreationOptions(options);
      const credential = await navigator.credentials.create({ publicKey: decodedOptions });
      if (!credential) {
        message.error("Passkey 创建被取消");
        return;
      }
      const serialized = serializeCreationCredential(credential as PublicKeyCredential);
      const deviceName = navigator.platform || "Passkey";
      await passkeyRegisterFinish(deviceName, serialized);
      message.success("Passkey 添加成功");
      fetchPasskeys();
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      if ((err as DOMException)?.name === "NotAllowedError") {
        message.error("操作被取消或设备不支持");
      } else {
        message.error(error.response?.data?.error_description || "添加 Passkey 失败");
      }
    } finally {
      setPasskeyRegistering(false);
    }
  };

  const handleRenamePasskey = async () => {
    if (!renameModalPasskey) return;
    setRenameLoading(true);
    try {
      const values = await renameForm.validateFields();
      await renamePasskey(renameModalPasskey.id, { name: values.name });
      message.success("重命名成功");
      setRenameModalPasskey(null);
      renameForm.resetFields();
      fetchPasskeys();
    } catch (err) {
      if ((err as { errorFields?: unknown }).errorFields) return;
      const error = err as AxiosError<ApiError>;
      message.error(error.response?.data?.error_description || "重命名失败");
    } finally {
      setRenameLoading(false);
    }
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    try {
      await deletePasskey(passkeyId);
      message.success("Passkey 已删除");
      fetchPasskeys();
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      message.error(error.response?.data?.error_description || "删除失败");
    }
  };

  const kycStatusVal = kycStatus?.status ?? "none";

  return (
    <AppLayout>
      <Title level={3} style={{ marginBottom: 24 }}>安全中心</Title>

      <Card style={{ maxWidth: 860 }}>
        <SecurityRow
          icon={<MailOutlined />}
          title="安全邮箱"
          description="用于接收消息、验证身份（变更安全设置等）"
          value={
            user?.email ? (
              <Text style={{ fontFamily: "monospace" }}>{maskEmail(user.email)}</Text>
            ) : (
              <Text type="secondary">未绑定</Text>
            )
          }
          action={
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => setEmailModalOpen(true)}
            >
              修改
            </Button>
          }
        />

        <SecurityRow
          icon={<KeyOutlined />}
          title="登录密码"
          description="登录账号时需要输入的密码"
          value={null}
          action={
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => setPasswordModalOpen(true)}
            >
              修改
            </Button>
          }
        />

        <SecurityRow
          icon={<SafetyCertificateOutlined />}
          title="实名认证"
          description="完成认证后，第三方应用可在你授权时获取身份信息"
          value={kycLoading ? <Spin size="small" /> : null}
          action={
            <Button
              type="link"
              icon={kycStatusVal === "success" ? <SafetyCertificateOutlined /> : <ArrowRightOutlined />}
              onClick={() => setKycModalOpen(true)}
            >
              {kycStatusVal === "success" ? "详情" : "去认证"}
            </Button>
          }
          last
        />
      </Card>
      <Card
        title={
          <Space>
            <UsbOutlined style={{ color: "#7c3aed" }} />
            <span>安全密钥</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            loading={passkeyRegistering}
            onClick={handleAddPasskey}
            size="small"
          >
            添加 Passkey
          </Button>
        }
        style={{ maxWidth: 860, marginTop: 16 }}
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 16, fontSize: 13 }}>
          Passkey 支持使用指纹、面容识别或硬件安全密钥登录，无需密码
        </Text>

        {passkeysLoading ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            <Spin />
          </div>
        ) : passkeys.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂未添加任何 Passkey"
          />
        ) : (
          <List
            dataSource={passkeys}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Tooltip title="重命名" key="rename">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setRenameModalPasskey(item);
                        renameForm.setFieldsValue({ name: item.name });
                      }}
                    />
                  </Tooltip>,
                  <Popconfirm
                    key="delete"
                    title="确认删除此 Passkey？"
                    description="删除后将无法使用此密钥登录"
                    onConfirm={() => handleDeletePasskey(item.id)}
                  >
                    <Tooltip title="删除">
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                    </Tooltip>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "#f5f0ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#7c3aed",
                        fontSize: 16,
                      }}
                    >
                      <KeyOutlined />
                    </span>
                  }
                  title={item.name}
                  description={
                    <Space split={<Divider type="vertical" />} size={0}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        添加于 {new Date(item.created_at).toLocaleDateString("zh-CN")}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.last_used_at
                          ? `最近使用 ${new Date(item.last_used_at).toLocaleDateString("zh-CN")}`
                          : "从未使用"}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <EmailModal open={emailModalOpen} onClose={() => setEmailModalOpen(false)} />
      <PasswordModal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
      <KycModal
        open={kycModalOpen}
        onClose={() => setKycModalOpen(false)}
        kycStatus={kycStatus}
      />
      <Modal
        title="重命名 Passkey"
        open={!!renameModalPasskey}
        onCancel={() => {
          setRenameModalPasskey(null);
          renameForm.resetFields();
        }}
        onOk={handleRenamePasskey}
        confirmLoading={renameLoading}
        okText="确认"
      >
        <Form form={renameForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: "请输入 Passkey 名称" }]}
          >
            <Input placeholder="例如：MacBook Pro、iPhone 17" />
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}