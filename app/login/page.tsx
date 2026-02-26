"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Form, Input, Button, Checkbox, App, Spin } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import AuthLayout from "@/components/layout/AuthLayout";
import { useAuthStore } from "@/stores/authStore";
import type { AxiosError } from "axios";
import type { ApiError } from "@/types";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await login(values);
      message.success("登录成功");
      const redirect = searchParams.get("redirect") || "/profile";
      router.push(redirect);
    } catch (err) {
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
      <Form layout="vertical" onFinish={onFinish} autoComplete="off" requiredMark={false}>
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
              <a href="/terms" target="_blank" className="text-[#7c3aed] hover:underline">
                用户协议
              </a>{" "}
              和{" "}
              <a href="/privacy" target="_blank" className="text-[#7c3aed] hover:underline">
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
