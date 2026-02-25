"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Typography,
  Button,
  Descriptions,
  Table,
  Tag,
  App,
  Spin,
  QRCode,
  Alert,
  Space,
  Card,
} from "antd";
import {
  SafetyCertificateOutlined,
  ReloadOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AppLayout from "@/components/layout/AppLayout";
import { startKyc, queryKyc, getKycStatus, getKycRecords } from "@/lib/api/kyc";
import type { KycStatus, KycRecord } from "@/types";
import type { AxiosError } from "axios";
import type { ApiError } from "@/types";

const { Title } = Typography;

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
  const { message } = App.useApp();
  const [status, setStatus] = useState<KycStatus | null>(null);
  const [records, setRecords] = useState<KycRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [h5Url, setH5Url] = useState<string | null>(null);
  const [verifyToken, setVerifyToken] = useState<string | null>(null);
  const [querying, setQuerying] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([getKycStatus(), getKycRecords()]);
      setStatus(s);
      setRecords(r);
    } catch {
      message.error("加载 KYC 数据失败");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await startKyc();
      setH5Url(res.h5_url);
      setVerifyToken(res.verify_token);
      message.info("请扫描二维码完成认证");
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const errCode = axiosErr.response?.data?.error;
      if (errCode === "already_verified") {
        message.warning("您已通过实名认证");
      } else if (errCode === "no_attempts") {
        message.error("认证次数已用完");
      } else {
        message.error("发起认证失败");
      }
    } finally {
      setStarting(false);
    }
  };

  const handleQuery = async () => {
    if (!verifyToken) return;
    setQuerying(true);
    try {
      await queryKyc(verifyToken);
      message.success("查询成功");
      setH5Url(null);
      setVerifyToken(null);
      fetchData();
    } catch {
      message.info("认证尚未完成，请稍后再试");
    } finally {
      setQuerying(false);
    }
  };

  const recordColumns: ColumnsType<KycRecord> = [
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (s: string) => {
        const cfg = statusConfig[s] || { color: "default", text: s };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    { title: "姓名", dataIndex: "id_name", key: "id_name", render: (v: string) => v || "—" },
    {
      title: "身份证号",
      dataIndex: "id_number",
      key: "id_number",
      render: (v: string) => v || "—",
    },
    {
      title: "分数",
      dataIndex: "score",
      key: "score",
      render: (v: number) => (v != null ? v.toFixed(2) : "—"),
    },
    {
      title: "时间",
      dataIndex: "created_at",
      key: "created_at",
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
  ];

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
            {!h5Url && status.attempts_remaining > 0 && (
              <Button
                type="primary"
                icon={<SafetyCertificateOutlined />}
                loading={starting}
                onClick={handleStart}
              >
                开始认证
              </Button>
            )}
            {h5Url && (
              <Card title="请使用手机扫描二维码完成认证" style={{ maxWidth: 360 }}>
                <QRCode value={h5Url} size={240} />
                <div style={{ marginTop: 16 }}>
                  <Button
                    icon={<ReloadOutlined />}
                    loading={querying}
                    onClick={handleQuery}
                  >
                    查询认证结果
                  </Button>
                </div>
              </Card>
            )}
          </Space>
        )}

      <Title level={4} style={{ marginTop: 32 }}>
        认证记录
      </Title>
      <Table
        columns={recordColumns}
        dataSource={records}
        rowKey="id"
        pagination={false}
        style={{ marginTop: 8 }}
      />
    </AppLayout>
  );
}
