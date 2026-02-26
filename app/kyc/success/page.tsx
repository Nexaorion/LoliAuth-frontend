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
  CheckCircleFilled,
  LoginOutlined,
  FileSearchOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { verifyKyc } from "@/lib/api/kyc";
import type { KycRecord } from "@/types";
import Image from "next/image";

const { Text, Title } = Typography;

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "LoliAuth";

export default function KycSuccessPage() {
  const router = useRouter();
  const [isLoggedIn] = useState(() => !!getToken());
  const [loading, setLoading] = useState(() => !!getToken());
  const [record, setRecord] = useState<KycRecord | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
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
    }
  }, [isLoggedIn]);

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
    if (record && record.status === "success") {
      return (
        <>
          <Divider />
          <Descriptions
            column={1}
            size="small"
            className="text-left"
            items={[
              {
                key: "id_name",
                label: "认证姓名",
                children: record.id_name ? (
                  <Text strong>{record.id_name}</Text>
                ) : (
                  <Text type="secondary">—</Text>
                ),
              },
              {
                key: "id_number",
                label: "身份证号",
                children: record.id_number ? (
                  <Text code>{record.id_number}</Text>
                ) : (
                  <Text type="secondary">—</Text>
                ),
              },
              {
                key: "score",
                label: "人脸比对",
                children:
                  record.score != null ? (
                    <Tag color="green">{record.score.toFixed(2)} 分</Tag>
                  ) : (
                    <Text type="secondary">—</Text>
                  ),
              },
              {
                key: "liveness_score",
                label: "活体检测",
                children:
                  record.liveness_score != null ? (
                    <Tag color="blue">
                      {record.liveness_score.toFixed(2)} 分
                    </Tag>
                  ) : (
                    <Text type="secondary">—</Text>
                  ),
              },
            ]}
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
            <CheckCircleFilled
              style={{ fontSize: 64, color: "#52c41a" }}
            />
          }
          title={
            <Title level={3} className="!mb-1">
              实名认证成功
            </Title>
          }
          subTitle={
            <Text type="secondary">
              您的身份已通过实名认证，认证结果已同步至您的账户。
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
            <Button
              type="primary"
              icon={<FileSearchOutlined />}
              size="large"
              block
              onClick={() => router.push("/kyc")}
            >
              查看认证详情
            </Button>
          ) : (
            <>
              <Alert
                type="info"
                showIcon
                message="登录后可查看完整认证详情"
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
