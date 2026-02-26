"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Table, Input, Space, Typography, App, Button, Select, Tooltip, Tag } from "antd";
import { SearchOutlined, DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AdminLayout from "@/components/layout/AdminLayout";
import { getAuditLogs, exportAuditLogs } from "@/lib/api/admin";
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
  const [exportFormat, setExportFormat] = useState<"txt" | "markdown">("txt");
  const [exporting, setExporting] = useState(false);

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

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportAuditLogs({
        format: exportFormat,
        ...(userIdFilter && { user_id: userIdFilter }),
        ...(actionFilter && { action: actionFilter }),
      });
      const ext = exportFormat === "markdown" ? "md" : "txt";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      message.success("导出成功");
    } catch {
      message.error("导出审计日志失败");
    } finally {
      setExporting(false);
    }
  };

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
      title: "设备名称",
      dataIndex: "device_name",
      key: "device_name",
      render: (v: string) => v || "—",
    },
    {
      title: "设备指纹",
      dataIndex: "device_fingerprint",
      key: "device_fingerprint",
      ellipsis: true,
      render: (v: string) =>
        v ? (
          <Tooltip title={v}>
            <code style={{ fontSize: 11 }}>{v.slice(0, 16)}…</code>
          </Tooltip>
        ) : (
          "—"
        ),
    },
    {
      title: "签名",
      dataIndex: "signature",
      key: "signature",
      ellipsis: true,
      render: (v: string) =>
        v ? (
          <Tooltip title={v}>
            <code style={{ fontSize: 11 }}>{v.slice(0, 16)}…</code>
          </Tooltip>
        ) : (
          "—"
        ),
    },
    {
      title: "签名验证",
      dataIndex: "signature_valid",
      key: "signature_valid",
      width: 100,
      align: "center",
      render: (v: boolean | null) => {
        if (v === true) return <Tag icon={<CheckCircleOutlined />} color="success">有效</Tag>;
        if (v === false) return <Tag icon={<CloseCircleOutlined />} color="error">无效</Tag>;
        return <Tag icon={<QuestionCircleOutlined />} color="default">未知</Tag>;
      },
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
        <Select
          value={exportFormat}
          onChange={setExportFormat}
          style={{ width: 120 }}
          options={[
            { label: "TXT 格式", value: "txt" },
            { label: "Markdown", value: "markdown" },
          ]}
        />
        <Button
          icon={<DownloadOutlined />}
          onClick={handleExport}
          loading={exporting}
        >
          导出日志
        </Button>
      </Space>
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
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
