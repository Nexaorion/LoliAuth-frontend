"use client";

import React, { useState, useRef } from "react";
import { Form, Input, Button, App, Result } from "antd";
import { MailOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import AuthLayout from "@/components/layout/AuthLayout";
import { forgotPassword } from "@/lib/api/account";
import type { AxiosError } from "axios";
import type { ApiError } from "@/types";
import Link from "next/link";
import HCaptchaWidget, { type HCaptchaWidgetRef } from "@/components/ui/HCaptchaWidget";

export default function ForgotPasswordPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const pendingEmailRef = useRef<{ email: string } | null>(null);
  const captchaRef = useRef<HCaptchaWidgetRef>(null);

  const onFinish = async (values: { email: string }) => {
    pendingEmailRef.current = { email: values.email };
    setLoading(true);
    try {
      captchaRef.current?.execute();
    } catch {
      pendingEmailRef.current = null;
      setLoading(false);
      message.error("人机验证初始化失败，请稍后重试");
    }
  };

  const handleVerify = async (token: string) => {
    const pending = pendingEmailRef.current;
    if (!pending) {
      return;
    }
    try {
      await forgotPassword({ email: pending.email, hcaptcha_token: token });
      setSent(true);
    } catch (err) {
      captchaRef.current?.reset();
      const error = err as AxiosError<ApiError>;
      if (error.response?.status === 429) {
        message.error("发送过于频繁，请等待 60 秒后再试");
      } else if (error.response?.status === 400) {
        message.error("请输入有效的邮箱地址");
      } else {
        message.error(
          error.response?.data?.error_description || "发送失败，请稍后重试"
        );
      }
    } finally {
      pendingEmailRef.current = null;
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="找回密码" subtitle="查看你的邮箱">
        <Result
          status="success"
          title="重置链接已发送"
          subTitle="如果该邮箱已注册，我们已向其发送了一封包含密码重置链接的邮件。请查看收件箱（包括垃圾邮件文件夹），链接有效期为 30 分钟。"
          extra={
            <Link href="/login">
              <Button type="primary" icon={<ArrowLeftOutlined />}>
                返回登录
              </Button>
            </Link>
          }
          style={{ padding: 0 }}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="找回密码"
      subtitle="输入你的注册邮箱，我们将发送重置链接"
      footer={
        <span>
          想起密码了？{" "}
          <Link
            href="/login"
            className="text-[#7c3aed] font-medium hover:underline"
          >
            返回登录
          </Link>
        </span>
      }
    >
      <Form
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        requiredMark={false}
      >
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
            placeholder="请输入注册时使用的邮箱"
            size="large"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 8 }}>
          <HCaptchaWidget
            ref={captchaRef}
            size="invisible"
            onVerify={(token) => handleVerify(token)}
            onExpire={() => {
              // 如果过期，取消挂起提交并停止加载状态
              pendingEmailRef.current = null;
              setLoading(false);
            }}
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
            发送重置链接
          </Button>
        </Form.Item>
      </Form>
    </AuthLayout>
  );
}
