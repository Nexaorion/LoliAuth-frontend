"use client";

import React, { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Form, Input, Button, App, Result, Spin } from "antd";
import { LockOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import AuthLayout from "@/components/layout/AuthLayout";
import {
  forgotPasswordVerify,
  forgotPasswordReset,
} from "@/lib/api/account";
import type { AxiosError } from "axios";
import type { ApiError } from "@/types";
import Link from "next/link";
import HCaptchaWidget, { type HCaptchaWidgetRef } from "@/components/ui/HCaptchaWidget";

type PageState = "loading" | "valid" | "invalid" | "success";

function VerifyForm() {
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const token = searchParams.get("token") || "";
  const [pageState, setPageState] = useState<PageState>("loading");
  const [submitting, setSubmitting] = useState(false);
  const [hcaptchaToken, setHcaptchaToken] = useState("");
  const captchaRef = useRef<HCaptchaWidgetRef>(null);

  useEffect(() => {
    if (!token) {
      setPageState("invalid");
      return;
    }

    forgotPasswordVerify({ token })
      .then((res) => {
        setPageState(res.valid ? "valid" : "invalid");
      })
      .catch(() => {
        setPageState("invalid");
      });
  }, [token]);

  const onFinish = async (values: {
    new_password: string;
    confirm_password: string;
  }) => {
    if (!hcaptchaToken) {
      message.warning("请先完成人机验证");
      return;
    }
    setSubmitting(true);
    try {
      await forgotPasswordReset({
        token,
        new_password: values.new_password,
        hcaptcha_token: hcaptchaToken,
      });
      setPageState("success");
    } catch (err) {
      captchaRef.current?.reset();
      setHcaptchaToken("");
      const error = err as AxiosError<ApiError>;
      if (error.response?.status === 400) {
        message.error("令牌无效或已过期，请重新发起密码重置");
        setPageState("invalid");
      } else {
        message.error(
          error.response?.data?.error_description || "重置失败，请稍后重试"
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (pageState === "loading") {
    return (
      <AuthLayout title="验证重置链接" subtitle="正在验证...">
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      </AuthLayout>
    );
  }

  if (pageState === "invalid") {
    return (
      <AuthLayout title="重置密码">
        <Result
          status="error"
          title="链接无效或已过期"
          subTitle="该密码重置链接无效或已过期，请重新发送重置链接。"
          extra={
            <Link href="/forgot-password">
              <Button type="primary">重新发送重置链接</Button>
            </Link>
          }
          style={{ padding: 0 }}
        />
      </AuthLayout>
    );
  }

  if (pageState === "success") {
    return (
      <AuthLayout title="重置密码">
        <Result
          status="success"
          title="密码重置成功"
          subTitle="你的密码已成功重置，请使用新密码登录。"
          extra={
            <Link href="/login">
              <Button type="primary" icon={<ArrowLeftOutlined />}>
                前往登录
              </Button>
            </Link>
          }
          style={{ padding: 0 }}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="设置新密码" subtitle="请输入你的新密码">
      <Form
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        requiredMark={false}
      >
        <Form.Item
          name="new_password"
          label={<span className="font-medium text-gray-700">新密码</span>}
          rules={[
            { required: true, message: "请输入新密码" },
            { min: 8, message: "密码至少需要 8 个字符" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="请输入新密码（至少 8 位）"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="confirm_password"
          label={
            <span className="font-medium text-gray-700">确认新密码</span>
          }
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

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            block
            size="large"
            className="!h-11 !font-medium"
          >
            重置密码
          </Button>
        </Form.Item>
      </Form>
    </AuthLayout>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="验证重置链接" subtitle="正在加载...">
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
        </AuthLayout>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
