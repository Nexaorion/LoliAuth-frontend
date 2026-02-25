"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Table, Input, Space, Typography, App } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AdminLayout from "@/components/layout/AdminLayout";
import { getAuditLogs } from "@/lib/api/admin";
import type { AuditLog } from "@/types";

const { Title } = Typography;

export default function AdminAuditLogsPage() {
  const { message } = App.useApp();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [userIdFilter, setUserIdFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAuditLogs({
        page,
        page_size: pageSize,
        ...(userIdFilter && { user_id: userIdFilter }),
        ...(actionFilter && { action: actionFilter }),
      });
      setLogs(res.data);
      setTotal(res.total);
    } catch {
      message.error("加载审计日志失败");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, userIdFilter, actionFilter, message]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns: ColumnsType<AuditLog> = [
    {
      title: "用户 ID",
      dataIndex: "user_id",
      key: "user_id",
      render: (v: string) => <code style={{ fontSize: 12 }}>{v}</code>,
      ellipsis: true,
    },
    { title: "操作", dataIndex: "action", key: "action" },
    { title: "IP 地址", dataIndex: "ip_address", key: "ip_address" },
    {
      title: "时间",
      dataIndex: "created_at",
      key: "created_at",
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
  ];

  return (
    <AdminLayout>
      <Title level={4}>审计日志</Title>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="用户 ID"
          prefix={<SearchOutlined />}
          value={userIdFilter}
          onChange={(e) => {
            setUserIdFilter(e.target.value);
            setPage(1);
          }}
          style={{ width: 320 }}
          allowClear
        />
        <Input
          placeholder="操作关键词"
          prefix={<SearchOutlined />}
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          style={{ width: 200 }}
          allowClear
        />
      </Space>
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
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
    </AdminLayout>
  );
}
