"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Modal,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  MinusOutlined,
  UndoOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  getUsers,
  getAdminKycStatus,
  getAdminKycRecords,
  adjustKycAttempts,
  setKycAttempts,
  resetKycStatus,
} from "@/lib/api/admin";
import type { AdminUser, KycStatus, KycRecord } from "@/types";

const { Title } = Typography;

const kycStatusMap: Record<string, { color: string; text: string }> = {
  none: { color: "default", text: "未认证" },
  pending: { color: "processing", text: "认证中" },
  success: { color: "success", text: "已认证" },
  failed: { color: "error", text: "认证失败" },
  expired: { color: "warning", text: "已过期" },
};

const recordStatusMap: Record<string, { color: string; text: string }> = {
  pending: { color: "processing", text: "认证中" },
  success: { color: "success", text: "已认证" },
  failed: { color: "error", text: "认证失败" },
  expired: { color: "warning", text: "已过期" },
};

export default function AdminKycPage() {
  const { message } = App.useApp();

  // Users list state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [listLoading, setListLoading] = useState(true);

  // Detail modal state
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [records, setRecords] = useState<KycRecord[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [delta, setDelta] = useState<number>(1);
  const [setAttemptsVal, setSetAttemptsVal] = useState<number>(1);

  const fetchUsers = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await getUsers({
        page,
        page_size: pageSize,
        ...(search && { email: search }),
      });
      setUsers(res.data);
      setTotal(res.total);
    } catch {
      message.error("加载用户列表失败");
    } finally {
      setListLoading(false);
    }
  }, [page, pageSize, search, message]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openDetail = async (user: AdminUser) => {
    setDetailUser(user);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const [s, r] = await Promise.all([
        getAdminKycStatus(user.id),
        getAdminKycRecords(user.id),
      ]);
      setKycStatus(s);
      setRecords(r);
    } catch {
      message.error("加载 KYC 详情失败");
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async () => {
    if (!detailUser) return;
    try {
      const [s, r] = await Promise.all([
        getAdminKycStatus(detailUser.id),
        getAdminKycRecords(detailUser.id),
      ]);
      setKycStatus(s);
      setRecords(r);
    } catch {
      // silent
    }
    fetchUsers();
  };

  const handleAdjust = async (d: number) => {
    if (!detailUser) return;
    try {
      const res = await adjustKycAttempts(detailUser.id, d);
      message.success(`操作成功，剩余次数：${res.attempts_remaining}`);
      refreshDetail();
    } catch {
      message.error("操作失败");
    }
  };

  const handleSetAttempts = async () => {
    if (!detailUser) return;
    try {
      const res = await setKycAttempts(detailUser.id, setAttemptsVal);
      message.success(`设置成功，剩余次数：${res.attempts_remaining}`);
      refreshDetail();
    } catch {
      message.error("设置失败");
    }
  };

  const handleReset = async () => {
    if (!detailUser) return;
    try {
      await resetKycStatus(detailUser.id);
      message.success("KYC 状态已重置");
      refreshDetail();
    } catch {
      message.error("重置失败");
    }
  };

  const userColumns: ColumnsType<AdminUser> = [
    {
      title: "用户 ID",
      dataIndex: "id",
      key: "id",
      ellipsis: true,
      width: 280,
    },
    { title: "邮箱", dataIndex: "email", key: "email" },
    {
      title: "KYC 状态",
      dataIndex: "kyc_status",
      key: "kyc_status",
      width: 120,
      render: (s: string) => {
        const cfg = kycStatusMap[s] || { color: "default", text: s };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: "剩余次数",
      dataIndex: "kyc_attempts_remaining",
      key: "kyc_attempts_remaining",
      width: 100,
    },
    {
      title: "操作",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => openDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  const recordColumns: ColumnsType<KycRecord> = [
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (s: string) => {
        const cfg = recordStatusMap[s] || { color: "default", text: s };
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
          placeholder="搜索邮箱 / 用户 ID / 昵称"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ width: 360 }}
          allowClear
        />
      </Space>

      <Table
        columns={userColumns}
        dataSource={users}
        rowKey="id"
        loading={listLoading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Modal
        title={
          detailUser
            ? `KYC 详情 — ${detailUser.email}`
            : "KYC 详情"
        }
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false);
          setDetailUser(null);
          setKycStatus(null);
          setRecords([]);
        }}
        footer={null}
        width={800}
        loading={detailLoading}
      >
        {kycStatus && (
          <>
            <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="用户 ID">
                {detailUser?.id}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                {detailUser?.email}
              </Descriptions.Item>
              <Descriptions.Item label="认证状态">
                <Tag color={kycStatusMap[kycStatus.status]?.color}>
                  {kycStatusMap[kycStatus.status]?.text}
                </Tag>
              </Descriptions.Item>
              {kycStatus.id_name && (
                <Descriptions.Item label="姓名">
                  {kycStatus.id_name}
                </Descriptions.Item>
              )}
              {kycStatus.id_number && (
                <Descriptions.Item label="身份证号">
                  {kycStatus.id_number}
                </Descriptions.Item>
              )}
              {kycStatus.fail_reason && (
                <Descriptions.Item label="失败原因">
                  {kycStatus.fail_reason}
                </Descriptions.Item>
              )}
              {kycStatus.fail_category && (
                <Descriptions.Item label="失败分类">
                  <Tag>{kycStatus.fail_category}</Tag>
                </Descriptions.Item>
              )}
              {kycStatus.baidu_error_code && (
                <Descriptions.Item label="百度错误码">
                  {kycStatus.baidu_error_code}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="剩余认证次数">
                {kycStatus.attempts_remaining}
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
                    value={setAttemptsVal}
                    onChange={(v) => setSetAttemptsVal(v ?? 0)}
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
        )}
      </Modal>
    </AdminLayout>
  );
}
