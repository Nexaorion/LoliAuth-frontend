"use client";

import React, { useEffect, useState } from "react";
import {
  Result,
  Button,
  Card,
  Descriptions,
  Typography,
  Space,
  Spin,
  Tag,
  Alert,
  Divider,
} from "antd";
import {
  CloseCircleFilled,
  LoginOutlined,
  FileSearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { verifyKyc } from "@/lib/api/kyc";
import type { KycRecord, KycFailCategory } from "@/types";
import Image from "next/image";

const { Text, Title } = Typography;

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "LoliAuth";

const failCategoryLabels: Record<KycFailCategory, string> = {
  liveness_failed: "活体检测失败",
  face_quality_issue: "人脸质量问题",
  face_occlusion: "人脸遮挡",
  id_mismatch: "身份信息不匹配",
  environment_issue: "设备或浏览器不兼容",
  user_action_required: "需要用户操作",
  timeout: "操作超时",
  security_risk: "安全风控触发",
  token_invalid: "认证令牌已过期",
  rate_limit: "请求过于频繁",
  video_issue: "视频问题",
  param_error: "参数错误",
  not_started: "认证尚未开始",
  processing: "认证处理中",
  not_completed: "认证未完成",
  result_expired: "查询结果已过期",
  service_error: "服务异常",
};

const failCategoryColors: Partial<Record<KycFailCategory, string>> = {
  liveness_failed: "red",
  face_quality_issue: "orange",
  face_occlusion: "orange",
  id_mismatch: "red",
  environment_issue: "blue",
  user_action_required: "blue",
  timeout: "gold",
  security_risk: "red",
  token_invalid: "purple",
  rate_limit: "gold",
  video_issue: "orange",
  param_error: "red",
  not_started: "default",
  processing: "processing",
  not_completed: "gold",
  result_expired: "purple",
  service_error: "red",
};

export default function KycFailedPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<KycRecord | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (token) {
      setIsLoggedIn(true);
      verifyKyc()
        .then((data) => {
          setRecord(data);
        })
        .catch((err) => {
          const msg =
            err?.response?.data?.error_description ||
            err?.message ||
            "获取认证详情失败";
          setFetchError(msg);
        })
        .finally(() => setLoading(false));
    } else {
      setIsLoggedIn(false);
      setLoading(false);
    }
  }, []);

  const renderDetails = () => {
    if (!isLoggedIn) return null;
    if (loading) {
      return (
        <div className="flex justify-center py-4">
          <Spin size="small" tip="正在获取认证详情..." />
        </div>
      );
    }
    if (fetchError) {
      return (
        <Alert
          type="warning"
          showIcon
          message="无法获取认证详情"
          description={fetchError}
          className="text-left"
        />
      );
    }
    if (record) {
      const items = [];

      if (record.fail_reason) {
        items.push({
          key: "fail_reason",
          label: "失败原因",
          children: <Text type="danger">{record.fail_reason}</Text>,
        });
      }

      if (record.fail_category) {
        items.push({
          key: "fail_category",
          label: "失败分类",
          children: (
            <Tag
              color={failCategoryColors[record.fail_category] ?? "default"}
            >
              {failCategoryLabels[record.fail_category] ?? record.fail_category}
            </Tag>
          ),
        });
      }

      if (record.baidu_error_code != null) {
        items.push({
          key: "baidu_error_code",
          label: "错误码",
          children: <Text code>{record.baidu_error_code}</Text>,
        });
      }

      if (items.length === 0) return null;

      return (
        <>
          <Divider />
          <Descriptions
            column={1}
            size="small"
            className="text-left"
            items={items}
          />
        </>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f5] px-4 py-12">
      <div className="mb-6 flex flex-col items-center">
        <Image
          src="/Nexaorion-Logo-purple.png"
          alt={APP_NAME}
          width={48}
          height={48}
          className="mb-3"
          priority
        />
        <Title level={5} className="!mb-0 text-gray-700">
          {APP_NAME} 实名认证
        </Title>
      </div>

      <Card
        className="w-full max-w-[480px] shadow-sm"
        styles={{ body: { padding: "32px 40px" } }}
      >
        <Result
          icon={
            <CloseCircleFilled
              style={{ fontSize: 64, color: "#ff4d4f" }}
            />
          }
          title={
            <Title level={3} className="!mb-1">
              实名认证失败
            </Title>
          }
          subTitle={
            <Text type="secondary">
              您的身份认证未通过，请查看失败原因后重新尝试。
            </Text>
          }
          extra={null}
        />

        {renderDetails()}

        <Space
          direction="vertical"
          size="small"
          className="w-full mt-4"
        >
          {isLoggedIn ? (
            <>
              <Button
                type="primary"
                danger
                icon={<ReloadOutlined />}
                size="large"
                block
                onClick={() => router.push("/kyc")}
              >
                重新认证
              </Button>
              <Button
                icon={<FileSearchOutlined />}
                size="large"
                block
                onClick={() => router.push("/kyc")}
              >
                查看详情
              </Button>
            </>
          ) : (
            <>
              <Alert
                type="info"
                showIcon
                message="登录后可查看失败原因并重新认证"
                className="text-left"
              />
              <Button
                type="primary"
                icon={<LoginOutlined />}
                size="large"
                block
                onClick={() => router.push("/login")}
              >
                登录查看详情
              </Button>
            </>
          )}
          <Button
            size="large"
            block
            onClick={() => router.push("/")}
          >
            返回首页
          </Button>
        </Space>
      </Card>

      <div className="mt-8 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} {APP_NAME}
      </div>
    </div>
  );
}
