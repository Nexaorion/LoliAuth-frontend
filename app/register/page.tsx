"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, Checkbox, App } from "antd";
import { MailOutlined, LockOutlined, UserOutlined, SafetyOutlined } from "@ant-design/icons";
import AuthLayout from "@/components/layout/AuthLayout";
import { register, sendRegisterCode } from "@/lib/api/account";
import type { AxiosError } from "axios";
import type { ApiError } from "@/types";
import Link from "next/link";
import PolicyModal from "@/components/ui/PolicyModal";
import HCaptchaWidget, { type HCaptchaWidgetRef } from "@/components/ui/HCaptchaWidget";

export default function RegisterPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [policyModal, setPolicyModal] = useState<"user" | "privacy" | null>(null);
  const [hcaptchaToken, setHcaptchaToken] = useState("");
  const captchaRef = useRef<HCaptchaWidgetRef>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = useCallback(() => {
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

  const handleSendCode = async () => {
    try {
      await form.validateFields(["email"]);
    } catch {
      return;
    }
    if (!hcaptchaToken) {
      message.warning("请先完成人机验证");
      return;
    }

    const email = form.getFieldValue("email") as string;
    const usedToken = hcaptchaToken;
    setSendingCode(true);
    try {
      await sendRegisterCode({ email, hcaptcha_token: usedToken });
      message.success("验证码已发送，请查收邮箱");
      captchaRef.current?.reset();
      setHcaptchaToken("");
    } catch (err) {
      captchaRef.current?.reset();
      setHcaptchaToken("");
      const error = err as AxiosError<ApiError>;
      if (error.response?.status === 429) {
        message.error("发送过于频繁，请稍后再试");
      } else {
        message.error(
          error.response?.data?.error_description || "验证码发送失败，请稍后重试"
        );
      }
    } finally {
      setSendingCode(false);
    }
  };

  const onFinish = async (values: {
    name: string;
    email: string;
    password: string;
    verify_code: string;
  }) => {
    if (!hcaptchaToken) {
      message.warning("请先完成人机验证");
      return;
    }
    setLoading(true);
    try {
      await register({
        email: values.email,
        password: values.password,
        verify_code: values.verify_code,
        hcaptcha_token: hcaptchaToken,
      });
      message.success("注册成功，请登录");
      router.push("/login");
    } catch (err) {
      captchaRef.current?.reset();
      setHcaptchaToken("");
      const error = err as AxiosError<ApiError>;
      if (error.response?.status === 409) {
        message.error("该邮箱已被注册");
      } else {
        message.error(
          error.response?.data?.error_description || "注册失败，请稍后重试"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAgreePolicy = () => {
    setPolicyModal(null);
  };

  return (
    <AuthLayout
      title="创建账户"
      subtitle="开始在 Loli Land 的冒险旅程吧！"
      footer={
        <span>
          已有账户？{" "}
          <Link href="/login" className="text-[#7c3aed] font-medium hover:underline">
            立即登录
          </Link>
        </span>
      }
    >
      <PolicyModal
        title="用户协议"
        open={policyModal === "user"}
        policyUrl="/policies/user-agreement.md"
        onAgree={() => handleAgreePolicy()}
        onCancel={() => setPolicyModal(null)}
      />
      <PolicyModal
        title="隐私政策"
        open={policyModal === "privacy"}
        policyUrl="/policies/privacy-policy.md"
        onAgree={() => handleAgreePolicy()}
        onCancel={() => setPolicyModal(null)}
      />
      <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off" requiredMark={false}>
        <Form.Item
          name="name"
          label={<span className="font-medium text-gray-700">昵称</span>}
          rules={[{ required: true, message: "请输入昵称" }]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="请输入昵称"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="email"
          label={<span className="font-medium text-gray-700">邮箱</span>}
          rules={[
            { required: true, message: "请输入邮箱" },
            { type: "email", message: "请输入有效的邮箱地址" },
          ]}
        >
          <Input
            prefix={<MailOutlined className="text-gray-400" />}
            placeholder="请输入邮箱"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-medium text-gray-700">邮箱验证码</span>}
          required
        >
          <div className="flex gap-2">
            <Form.Item
              name="verify_code"
              noStyle
              rules={[
                { required: true, message: "请输入验证码" },
                { pattern: /^\d{6}$/, message: "验证码为6位数字" },
              ]}
            >
              <Input
                prefix={<SafetyOutlined className="text-gray-400" />}
                placeholder="6位数字验证码"
                maxLength={6}
                size="large"
                className="flex-1"
              />
            </Form.Item>
            <Button
              size="large"
              onClick={handleSendCode}
              loading={sendingCode}
              disabled={countdown > 0}
              className="!min-w-[120px]"
            >
              {countdown > 0 ? `${countdown}s 后重发` : "发送验证码"}
            </Button>
          </div>
        </Form.Item>

        <Form.Item
          name="password"
          label={<span className="font-medium text-gray-700">密码</span>}
          extra={<span className="text-xs text-gray-400">密码长度至少 8 个字符</span>}
          rules={[
            { required: true, message: "请输入密码" },
            { min: 8, message: "密码至少 8 位" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="创建密码"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="agreement"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value
                  ? Promise.resolve()
                  : Promise.reject(new Error("请先同意用户协议和隐私政策")),
            },
          ]}
        >
          <Checkbox>
            <span className="text-xs sm:text-sm text-gray-600">
              我已阅读并同意{" "}
              <a
                className="text-[#7c3aed] hover:underline"
                onClick={(e) => { e.preventDefault(); setPolicyModal("user"); }}
                style={{ cursor: "pointer" }}
              >
                用户协议
              </a>{" "}
              和{" "}
              <a
                className="text-[#7c3aed] hover:underline"
                onClick={(e) => { e.preventDefault(); setPolicyModal("privacy"); }}
                style={{ cursor: "pointer" }}
              >
                隐私政策
              </a>
            </span>
          </Checkbox>
        </Form.Item>

        <Form.Item style={{ marginBottom: 8 }}>
          <HCaptchaWidget
            ref={captchaRef}
            onVerify={(token) => setHcaptchaToken(token)}
            onExpire={() => setHcaptchaToken("")}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            className="!h-11 !font-medium"
          >
            注 册
          </Button>
        </Form.Item>
      </Form>
    </AuthLayout>
  );
}
