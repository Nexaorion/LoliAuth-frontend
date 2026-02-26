"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Typography,
  Card,
  Form,
  Input,
  Steps,
  Button,
  Space,
  App,
  Descriptions,
  Tag,
  Spin,
  Anchor,
} from "antd";
import {
  MailOutlined,
  LockOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
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
} from "@/lib/api/account";
import { getKycStatus } from "@/lib/api/kyc";
import type { AxiosError } from "axios";
import type { ApiError, KycStatus } from "@/types";

const { Title, Text } = Typography;

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

function EmailSection() {
  const { message } = App.useApp();
  const user = useAuthStore((s) => s.user);
  const loadProfile = useAuthStore((s) => s.loadProfile);
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [sendingOldCode, setSendingOldCode] = useState(false);
  const [sendingNewCode, setSendingNewCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const oldCodeCountdown = useCountdown();
  const newCodeCountdown = useCountdown();
  const [savedNewEmail, setSavedNewEmail] = useState("");

  const handleSendOldCode = async () => {
    setSendingOldCode(true);
    try {
      await sendOldEmailCode();
      message.success("验证码已发送至你的当前邮箱");
      oldCodeCountdown.start();
      setStep(1);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      if (error.response?.status === 429) {
        message.error("发送过于频繁，请等待 60 秒后再试");
      } else {
        message.error(
          error.response?.data?.error_description || "发送失败，请稍后重试"
        );
      }
    } finally {
      setSendingOldCode(false);
    }
  };

  const handleStep1 = async (values: {
    old_code: string;
    new_email: string;
  }) => {
    setSendingNewCode(true);
    try {
      await sendNewEmailCode({
        old_code: values.old_code,
        new_email: values.new_email,
      });
      message.success("验证码已发送至新邮箱");
      newCodeCountdown.start();
      setSavedNewEmail(values.new_email);
      setStep(2);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      const status = error.response?.status;
      if (status === 400) {
        message.error("旧邮箱验证码无效或已过期");
      } else if (status === 409) {
        message.error("新邮箱已被注册");
      } else if (status === 429) {
        message.error("发送过于频繁，请等待 60 秒后再试");
      } else {
        message.error(
          error.response?.data?.error_description || "操作失败，请稍后重试"
        );
      }
    } finally {
      setSendingNewCode(false);
    }
  };

  const handleStep2 = async (values: { new_code: string }) => {
    setSubmitting(true);
    try {
      await changeEmail({
        new_email: savedNewEmail,
        new_code: values.new_code,
      });
      message.success("邮箱修改成功");
      form.resetFields();
      setStep(0);
      setSavedNewEmail("");
      await loadProfile();
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      const status = error.response?.status;
      if (status === 400) {
        message.error("验证码无效或已过期");
      } else if (status === 409) {
        message.error("新邮箱已被注册");
      } else {
        message.error(
          error.response?.data?.error_description || "操作失败，请稍后重试"
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setStep(0);
    form.resetFields();
    setSavedNewEmail("");
  };

  return (
    <Card id="email" style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <MailOutlined style={{ fontSize: 20, color: "#7c3aed" }} />
        <Title level={4} style={{ margin: 0 }}>安全邮箱</Title>
      </div>

      <Descriptions column={1} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="当前绑定邮箱">
          <Text strong>{user?.email ?? "—"}</Text>
        </Descriptions.Item>
      </Descriptions>

      <Steps
        current={step}
        size="small"
        style={{ marginBottom: 24 }}
        items={[
          { title: "验证当前邮箱" },
          { title: "填写新邮箱" },
          { title: "验证新邮箱" },
        ]}
      />

      {step === 0 && (
        <div>
          <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
            为了安全起见，更改邮箱需要先验证你的当前邮箱。点击下方按钮发送验证码。
          </Text>
          <Button
            type="primary"
            loading={sendingOldCode}
            disabled={oldCodeCountdown.countdown > 0}
            onClick={handleSendOldCode}
            icon={<MailOutlined />}
          >
            {oldCodeCountdown.countdown > 0
              ? `${oldCodeCountdown.countdown} 秒后可重发`
              : "发送验证码到当前邮箱"}
          </Button>
        </div>
      )}

      {step === 1 && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleStep1}
          requiredMark={false}
        >
          <Form.Item
            name="old_code"
            label="当前邮箱验证码"
            rules={[
              { required: true, message: "请输入验证码" },
              { pattern: /^\d{6}$/, message: "验证码为 6 位数字" },
            ]}
          >
            <Input
              placeholder="请输入发送到当前邮箱的 6 位验证码"
              maxLength={6}
              suffix={
                <Button
                  type="link"
                  size="small"
                  disabled={oldCodeCountdown.countdown > 0}
                  loading={sendingOldCode}
                  onClick={handleSendOldCode}
                  style={{ padding: 0 }}
                >
                  {oldCodeCountdown.countdown > 0
                    ? `${oldCodeCountdown.countdown}s`
                    : "重新发送"}
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
            <Input
              prefix={<MailOutlined className="text-gray-400" />}
              placeholder="请输入新的邮箱地址"
            />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" loading={sendingNewCode}>
              下一步
            </Button>
            <Button onClick={resetAll}>取消</Button>
          </Space>
        </Form>
      )}

      {step === 2 && (
        <Form layout="vertical" onFinish={handleStep2} requiredMark={false}>
          <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
            验证码已发送至 <Text strong>{savedNewEmail}</Text>，请查收。
          </Text>

          <Form.Item
            name="new_code"
            label="新邮箱验证码"
            rules={[
              { required: true, message: "请输入验证码" },
              { pattern: /^\d{6}$/, message: "验证码为 6 位数字" },
            ]}
          >
            <Input
              placeholder="请输入发送到新邮箱的 6 位验证码"
              maxLength={6}
            />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              确认更改
            </Button>
            <Button onClick={resetAll}>取消</Button>
          </Space>
        </Form>
      )}
    </Card>
  );
}

function PasswordSection() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { countdown, start: startCountdown } = useCountdown();

  const handleSendCode = async () => {
    setSendingCode(true);
    try {
      await sendPasswordResetCode();
      message.success("验证码已发送至你的邮箱");
      startCountdown();
      setStep(1);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      if (error.response?.status === 429) {
        message.error("发送过于频繁，请等待 60 秒后再试");
      } else {
        message.error(
          error.response?.data?.error_description || "发送失败，请稍后重试"
        );
      }
    } finally {
      setSendingCode(false);
    }
  };

  const onFinish = async (values: {
    verify_code: string;
    new_password: string;
  }) => {
    setSubmitting(true);
    try {
      await resetPassword({
        verify_code: values.verify_code,
        new_password: values.new_password,
      });
      message.success("密码修改成功");
      form.resetFields();
      setStep(0);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      if (error.response?.status === 400) {
        message.error("验证码无效或已过期，请重新发送");
      } else {
        message.error(
          error.response?.data?.error_description || "重置失败，请稍后重试"
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card id="password" style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <KeyOutlined style={{ fontSize: 20, color: "#7c3aed" }} />
        <Title level={4} style={{ margin: 0 }}>密码</Title>
      </div>

      <Steps
        current={step}
        size="small"
        style={{ marginBottom: 24 }}
        items={[
          { title: "发送验证码" },
          { title: "设置新密码" },
        ]}
      />

      {step === 0 && (
        <div>
          <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
            修改密码需要先验证你的邮箱。点击下方按钮，我们将向你的注册邮箱发送一个验证码。
          </Text>
          <Button
            type="primary"
            loading={sendingCode}
            disabled={countdown > 0}
            onClick={handleSendCode}
            icon={<MailOutlined />}
          >
            {countdown > 0 ? `${countdown} 秒后可重发` : "发送验证码"}
          </Button>
        </div>
      )}

      {step === 1 && (
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Form.Item
            name="verify_code"
            label="邮箱验证码"
            rules={[
              { required: true, message: "请输入验证码" },
              { pattern: /^\d{6}$/, message: "验证码为 6 位数字" },
            ]}
          >
            <Input
              placeholder="请输入 6 位数字验证码"
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
              prefix={<LockOutlined className="text-gray-400" />}
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
                  if (!value || getFieldValue("new_password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("两次输入的密码不一致"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="请再次输入新密码"
            />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              确认修改
            </Button>
            <Button
              onClick={() => {
                setStep(0);
                form.resetFields();
              }}
            >
              取消
            </Button>
          </Space>
        </Form>
      )}
    </Card>
  );
}

function KycSection() {
  const router = useRouter();
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getKycStatus()
      .then(setKycStatus)
      .catch(() => {
        // ignore
      })
      .finally(() => setLoading(false));
  }, []);

  const statusConfig: Record<string, { color: string; text: string; icon?: React.ReactNode }> = {
    none: { color: "default", text: "未认证" },
    pending: {
      color: "processing",
      text: "认证中",
    },
    success: {
      color: "success",
      text: "已认证",
      icon: <CheckCircleFilled />,
    },
    failed: {
      color: "error",
      text: "认证失败",
      icon: <CloseCircleFilled />,
    },
    expired: { color: "warning", text: "已过期" },
  };

  const status = kycStatus?.status ?? "none";
  const config = statusConfig[status] ?? statusConfig.none;

  return (
    <Card id="kyc" style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <SafetyCertificateOutlined style={{ fontSize: 20, color: "#7c3aed" }} />
        <Title level={4} style={{ margin: 0 }}>实名认证</Title>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 24 }}>
          <Spin />
        </div>
      ) : (
        <>
          <Descriptions column={1} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="认证状态">
              <Tag color={config.color} icon={config.icon}>
                {config.text}
              </Tag>
            </Descriptions.Item>
            {kycStatus?.status === "success" && kycStatus.id_name && (
              <Descriptions.Item label="实名姓名">
                {kycStatus.id_name}
              </Descriptions.Item>
            )}
            {kycStatus?.status === "success" && kycStatus.id_number && (
              <Descriptions.Item label="身份证号">
                {kycStatus.id_number}
              </Descriptions.Item>
            )}
            {kycStatus?.status === "success" && kycStatus.verified_at && (
              <Descriptions.Item label="认证时间">
                {new Date(kycStatus.verified_at).toLocaleString("zh-CN")}
              </Descriptions.Item>
            )}
            {kycStatus?.status === "failed" && kycStatus.fail_reason && (
              <Descriptions.Item label="失败原因">
                <Text type="danger">{kycStatus.fail_reason}</Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="剩余认证次数">
              {kycStatus?.attempts_remaining ?? "—"}
            </Descriptions.Item>
          </Descriptions>

          <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
            {status === "success"
              ? "你已完成实名认证，无需重复操作。"
              : "完成实名认证后，第三方应用可获取你授权的真实姓名和身份证信息。"}
          </Text>

          {status !== "success" && (
            <Button
              type="primary"
              icon={<SafetyCertificateOutlined />}
              onClick={() => router.push("/kyc")}
            >
              前往认证
            </Button>
          )}
        </>
      )}
    </Card>
  );
}

const anchorItems = [
  { key: "email", href: "#email", title: "安全邮箱" },
  { key: "password", href: "#password", title: "密码" },
  { key: "kyc", href: "#kyc", title: "实名认证" },
];

export default function SecurityPage() {
  return (
    <AppLayout>
      <Title level={3} style={{ marginBottom: 24 }}>安全中心</Title>

      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <EmailSection />
          <PasswordSection />
          <KycSection />
        </div>
        <div
          style={{ width: 160, flexShrink: 0 }}
          className="hidden lg:block"
        >
          <Anchor
            items={anchorItems}
            offsetTop={80}
            targetOffset={80}
          />
        </div>
      </div>
    </AppLayout>
  );
}
