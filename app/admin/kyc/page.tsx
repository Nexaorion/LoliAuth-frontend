"use client";

import React, { useState } from "react";
import {
  Typography,
  Input,
  Button,
  Descriptions,
  Table,
  Tag,
  InputNumber,
  Space,
  App,
  Card,
  Divider,
  Empty,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  MinusOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  getAdminKycStatus,
  getAdminKycRecords,
  adjustKycAttempts,
  setKycAttempts,
  resetKycStatus,
} from "@/lib/api/admin";
import type { KycStatus, KycRecord } from "@/types";

const { Title } = Typography;

const statusMap: Record<string, { color: string; text: string }> = {
  none: { color: "default", text: "未认证" },
  pending: { color: "processing", text: "认证中" },
  success: { color: "success", text: "已认证" },
  failed: { color: "error", text: "认证失败" },
  expired: { color: "warning", text: "已过期" },
};

export default function AdminKycPage() {
  const { message } = App.useApp();
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState<KycStatus | null>(null);
  const [records, setRecords] = useState<KycRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [delta, setDelta] = useState<number>(1);
  const [setAttempts, setSetAttempts] = useState<number>(1);

  const handleSearch = async () => {
    if (!userId.trim()) {
      message.warning("请输入用户 ID");
      return;
    }
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        getAdminKycStatus(userId),
        getAdminKycRecords(userId),
      ]);
      setStatus(s);
      setRecords(r);
    } catch {
      message.error("查询失败，请检查用户 ID");
      setStatus(null);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = async (d: number) => {
    try {
      const res = await adjustKycAttempts(userId, d);
      message.success(`操作成功，剩余次数：${res.attempts_remaining}`);
      handleSearch();
    } catch {
      message.error("操作失败");
    }
  };

  const handleSetAttempts = async () => {
    try {
      const res = await setKycAttempts(userId, setAttempts);
      message.success(`设置成功，剩余次数：${res.attempts_remaining}`);
      handleSearch();
    } catch {
      message.error("设置失败");
    }
  };

  const handleReset = async () => {
    try {
      await resetKycStatus(userId);
      message.success("KYC 状态已重置");
      handleSearch();
    } catch {
      message.error("重置失败");
    }
  };

  const recordColumns: ColumnsType<KycRecord> = [
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (s: string) => {
        const cfg = statusMap[s] || { color: "default", text: s };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    { title: "姓名", dataIndex: "id_name", key: "id_name", render: (v: string) => v || "—" },
    { title: "身份证号", dataIndex: "id_number", key: "id_number", render: (v: string) => v || "—" },
    {
      title: "分数",
      dataIndex: "score",
      key: "score",
      render: (v: number) => (v != null ? v.toFixed(2) : "—"),
    },
    {
      title: "失败原因",
      dataIndex: "fail_reason",
      key: "fail_reason",
      ellipsis: true,
      render: (v: string) => v || "—",
    },
    {
      title: "失败分类",
      dataIndex: "fail_category",
      key: "fail_category",
      render: (v: string) => v ? <Tag>{v}</Tag> : "—",
    },
    {
      title: "时间",
      dataIndex: "created_at",
      key: "created_at",
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
  ];

  return (
    <AdminLayout>
      <Title level={4}>KYC 管理</Title>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="输入用户 ID"
          prefix={<SearchOutlined />}
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={{ width: 360 }}
          onPressEnter={handleSearch}
        />
        <Button type="primary" onClick={handleSearch} loading={loading}>
          查询
        </Button>
      </Space>

      {status ? (
        <>
          <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="认证状态">
              <Tag color={statusMap[status.status]?.color}>
                {statusMap[status.status]?.text}
              </Tag>
            </Descriptions.Item>
            {status.id_name && (
              <Descriptions.Item label="姓名">
                {status.id_name}
              </Descriptions.Item>
            )}
            {status.id_number && (
              <Descriptions.Item label="身份证号">
                {status.id_number}
              </Descriptions.Item>
            )}
            {status.fail_reason && (
              <Descriptions.Item label="失败原因">
                {status.fail_reason}
              </Descriptions.Item>
            )}
            {status.fail_category && (
              <Descriptions.Item label="失败分类">
                <Tag>{status.fail_category}</Tag>
              </Descriptions.Item>
            )}
            {status.baidu_error_code && (
              <Descriptions.Item label="百度错误码">
                {status.baidu_error_code}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="剩余认证次数">
              {status.attempts_remaining}
            </Descriptions.Item>
          </Descriptions>

          <Card title="操作" size="small" style={{ marginBottom: 24 }}>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Space>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => handleAdjust(delta)}
                >
                  增加次数
                </Button>
                <Button
                  icon={<MinusOutlined />}
                  onClick={() => handleAdjust(-delta)}
                >
                  减少次数
                </Button>
                <InputNumber
                  min={1}
                  value={delta}
                  onChange={(v) => setDelta(v || 1)}
                  style={{ width: 80 }}
                />
              </Space>
              <Divider style={{ margin: "8px 0" }} />
              <Space>
                <Button onClick={handleSetAttempts}>设置次数为</Button>
                <InputNumber
                  min={0}
                  value={setAttempts}
                  onChange={(v) => setSetAttempts(v ?? 0)}
                  style={{ width: 80 }}
                />
              </Space>
              <Divider style={{ margin: "8px 0" }} />
              <Button danger icon={<UndoOutlined />} onClick={handleReset}>
                重置 KYC 状态
              </Button>
            </Space>
          </Card>

          <Title level={5}>认证记录</Title>
          <Table
            columns={recordColumns}
            dataSource={records}
            rowKey="id"
            pagination={false}
          />
        </>
      ) : (
        !loading && <Empty description="请输入用户 ID 查询" />
      )}
    </AdminLayout>
  );
}
