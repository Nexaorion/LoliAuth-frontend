"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Table, Input, Space, Typography, App, Button, Select, Tooltip, Tag, Modal, Descriptions } from "antd";
import { SearchOutlined, DownloadOutlined, GlobalOutlined, WarningOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AdminLayout from "@/components/layout/AdminLayout";
import { getAuditLogs, exportAuditLogs } from "@/lib/api/admin";
import type { AuditLog, IpInfo } from "@/types";

const { Title } = Typography;

/** 将 usage_type 代码映射为可读标签 */
function formatUsageType(type: string): string {
  const map: Record<string, string> = {
    DCH: "数据中心",
    COM: "商业",
    ISP: "运营商",
    EDU: "教育",
    GOV: "政府",
    MIL: "军事",
    ORG: "组织",
    RES: "住宅",
    MOB: "移动网络",
  };
  return map[type] || type;
}

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
  const [ipModalOpen, setIpModalOpen] = useState(false);
  const [selectedIpInfo, setSelectedIpInfo] = useState<IpInfo | null>(null);
  const [ipModalTitle, setIpModalTitle] = useState("");

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

  const handleIpClick = (ip: string, ipInfo: IpInfo | null) => {
    setIpModalTitle(ip);
    setSelectedIpInfo(ipInfo);
    setIpModalOpen(true);
  };

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
    {
      title: "IP 地址",
      dataIndex: "ip_address",
      key: "ip_address",
      render: (_: string, record: AuditLog) => (
        <Button
          type="link"
          size="small"
          icon={<GlobalOutlined />}
          style={{ padding: 0, height: "auto" }}
          onClick={() => handleIpClick(record.ip_address, record.ip_info)}
          disabled={!record.ip_info}
        >
          {record.ip_address}
        </Button>
      ),
    },
    {
      title: "位置",
      key: "location",
      render: (_: unknown, record: AuditLog) => {
        if (!record.ip_info) return <Typography.Text type="secondary">—</Typography.Text>;
        const { city_name, country_name, country_code } = record.ip_info;
        return (
          <Tooltip title={`${city_name}, ${record.ip_info.region_name}, ${country_name}`}>
            {city_name}, {country_code}
          </Tooltip>
        );
      },
    },
    {
      title: "代理/风控",
      key: "risk",
      width: 140,
      align: "center",
      render: (_: unknown, record: AuditLog) => {
        if (!record.ip_info) return "—";
        const { is_proxy, fraud_score } = record.ip_info;
        return (
          <Space size={4}>
            {is_proxy ? (
              <Tag icon={<WarningOutlined />} color="warning">代理</Tag>
            ) : (
              <Tag color="success">直连</Tag>
            )}
            {fraud_score > 0 && (
              <Tooltip title={`欺诈风险评分: ${fraud_score}/100`}>
                <Tag color={fraud_score >= 50 ? "error" : fraud_score >= 20 ? "warning" : "default"}>
                  {fraud_score}
                </Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
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
        scroll={{ x: 1400 }}
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
          <Space>
            <GlobalOutlined />
            IP 详情：{ipModalTitle}
          </Space>
        }
        open={ipModalOpen}
        onCancel={() => setIpModalOpen(false)}
        footer={null}
        width={560}
      >
        {selectedIpInfo ? (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="国家/地区">
              {selectedIpInfo.country_name} ({selectedIpInfo.country_code})
            </Descriptions.Item>
            <Descriptions.Item label="省/州">{selectedIpInfo.region_name}</Descriptions.Item>
            <Descriptions.Item label="城市">{selectedIpInfo.city_name}</Descriptions.Item>
            <Descriptions.Item label="时区">{selectedIpInfo.time_zone}</Descriptions.Item>
            <Descriptions.Item label="纬度">{selectedIpInfo.latitude}</Descriptions.Item>
            <Descriptions.Item label="经度">{selectedIpInfo.longitude}</Descriptions.Item>
            <Descriptions.Item label="ISP" span={2}>{selectedIpInfo.isp}</Descriptions.Item>
            <Descriptions.Item label="AS" span={2}>
              {selectedIpInfo.as} (ASN {selectedIpInfo.asn})
            </Descriptions.Item>
            <Descriptions.Item label="用途类型">
              {formatUsageType(selectedIpInfo.usage_type)}
            </Descriptions.Item>
            <Descriptions.Item label="代理/VPN">
              {selectedIpInfo.is_proxy ? <Tag color="warning">是</Tag> : <Tag color="success">否</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="欺诈风险评分" span={2}>
              <Tag color={selectedIpInfo.fraud_score >= 50 ? "error" : selectedIpInfo.fraud_score >= 20 ? "warning" : "success"}>
                {selectedIpInfo.fraud_score} / 100
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Typography.Text type="secondary">无 IP 地理位置信息（私有/内网 IP）</Typography.Text>
        )}
      </Modal>
    </AdminLayout>
  );
}
