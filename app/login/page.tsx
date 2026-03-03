"use client";

import React, { Suspense, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Form, Input, Button, Checkbox, App, Spin, Divider } from "antd";
import { MailOutlined, LockOutlined, KeyOutlined } from "@ant-design/icons";
import AuthLayout from "@/components/layout/AuthLayout";
import { useAuthStore } from "@/stores/authStore";
import { setToken } from "@/lib/auth";
import { passkeyLoginBegin, passkeyLoginFinish } from "@/lib/api/account";
import type { AxiosError } from "axios";
import type { ApiError } from "@/types";
import Link from "next/link";
import PolicyModal from "@/components/ui/PolicyModal";
import HCaptchaWidget, { type HCaptchaWidgetRef } from "@/components/ui/HCaptchaWidget";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const login = useAuthStore((s) => s.login);
  const loadProfile = useAuthStore((s) => s.loadProfile);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [policyModal, setPolicyModal] = useState<"user" | "privacy" | null>(null);
  const [readStatus, setReadStatus] = useState({ user: false, privacy: false });
  const [hcaptchaToken, setHcaptchaToken] = useState("");
  const captchaRef = useRef<HCaptchaWidgetRef>(null);
  const [form] = Form.useForm();

  const onFinish = async (values: { email: string; password: string }) => {
    if (!hcaptchaToken) {
      message.warning("请先完成人机验证");
      return;
    }
    setLoading(true);
    try {
      await login({ ...values, hcaptcha_token: hcaptchaToken });
      message.success("登录成功");
      const redirect = searchParams.get("redirect") || "/profile";
      router.push(redirect);
    } catch (err) {
      captchaRef.current?.reset();
      setHcaptchaToken("");
      const error = err as AxiosError<ApiError>;
      const status = error.response?.status;
      if (status === 401) {
        message.error("邮箱或密码错误");
      } else if (status === 403) {
        message.error("账户已被禁用");
      } else {
        message.error(
          error.response?.data?.error_description || "登录失败，请稍后重试"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    try {
      const { decodeRequestOptions, serializeAssertionCredential, extractChallenge } = await import("@/lib/webauthn");
      const options = await passkeyLoginBegin();
      const challenge = extractChallenge(options);
      const decodedOptions = decodeRequestOptions(options);
      const credential = await navigator.credentials.get({ publicKey: decodedOptions });
      if (!credential) {
        message.error("Passkey 验证被取消");
        return;
      }
      const serialized = serializeAssertionCredential(credential as PublicKeyCredential);
      const res = await passkeyLoginFinish(challenge, serialized);
      setToken(res.access_token, res.expires_in);
      useAuthStore.setState({ token: res.access_token });
      await loadProfile();
      message.success("登录成功");
      const redirect = searchParams.get("redirect") || "/profile";
      router.push(redirect);
    } catch (err) {
      if ((err as DOMException)?.name === "NotAllowedError") {
        message.error("操作被取消或设备不支持");
      } else {
        const error = err as AxiosError<ApiError>;
        if (error.response?.status === 401) {
          message.error("Passkey 验证失败");
        } else {
          message.error(error.response?.data?.error_description || "Passkey 登录失败");
        }
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleAgreePolicy = (type: "user" | "privacy") => {
    const newStatus = { ...readStatus, [type]: true };
    setReadStatus(newStatus);
    
    if (type === "user" && !newStatus.privacy) {
      setPolicyModal("privacy");
    } else if (type === "privacy" && !newStatus.user) {
      setPolicyModal("user");
    } else {
      setPolicyModal(null);
      form.setFieldsValue({ agreement: true });
    }
  };

  return (
    <AuthLayout
      title="登录你的账户"
      subtitle="主人，欢迎回来！"
      footer={
        <span>
          还没有账户？{" "}
          <Link href="/register" className="text-[#7c3aed] font-medium hover:underline">
            立即注册
          </Link>
        </span>
      }
    >
      <PolicyModal
        title="用户协议"
        open={policyModal === "user"}
        policyUrl="/policies/user-agreement.md"
        onAgree={() => handleAgreePolicy("user")}
        onCancel={() => setPolicyModal(null)}
      />
      <PolicyModal
        title="隐私政策"
        open={policyModal === "privacy"}
        policyUrl="/policies/privacy-policy.md"
        onAgree={() => handleAgreePolicy("privacy")}
        onCancel={() => setPolicyModal(null)}
      />
      <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off" requiredMark={false}>
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
          name="password"
          label={<span className="font-medium text-gray-700">密码</span>}
          rules={[{ required: true, message: "请输入密码" }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="请输入密码"
            size="large"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 8 }}>
          <HCaptchaWidget
            ref={captchaRef}
            onVerify={(token) => setHcaptchaToken(token)}
            onExpire={() => setHcaptchaToken("")}
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

        <Form.Item style={{ marginBottom: 12 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            className="!h-11 !font-medium"
          >
            登 录
          </Button>
        </Form.Item>

        <div className="text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-[#7c3aed] hover:underline"
          >
            忘记密码？
          </Link>
        </div>

        <Divider plain style={{ margin: "16px 0 12px", fontSize: 12, color: "#8c8c8c" }}>
          或
        </Divider>

        <Button
          type="text"
          block
          size="large"
          icon={<KeyOutlined />}
          loading={passkeyLoading}
          onClick={handlePasskeyLogin}
          className="!text-[#7c3aed] hover:!bg-[#f5f0ff]"
        >
          通过 Passkey 登录
        </Button>
      </Form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="登录你的账户" subtitle="主人，欢迎回来！">
          <div className="flex justify-center py-12">
            <Spin />
          </div>
        </AuthLayout>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
