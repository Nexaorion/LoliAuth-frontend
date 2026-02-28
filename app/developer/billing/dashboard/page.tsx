"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Statistic,
  Row,
  Col,
  Typography,
  App,
  Segmented,
  Spin,
} from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import DeveloperLayout from "@/components/layout/DeveloperLayout";
import { getDeveloperDashboard } from "@/lib/api/billing";
import type { DashboardResponse } from "@/types";

const { Title } = Typography;

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function DeveloperDashboardPage() {
  const { message } = App.useApp();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<number>(7);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDeveloperDashboard({ days });
      setData(res);
    } catch {
      message.error("加载看板数据失败");
    } finally {
      setLoading(false);
    }
  }, [days, message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <DeveloperLayout>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          支付看板
        </Title>
        <Segmented
          options={[
            { label: "近 7 天", value: 7 },
            { label: "近 14 天", value: 14 },
            { label: "近 31 天", value: 31 },
          ]}
          value={days}
          onChange={(v) => setDays(v as number)}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="订单总数"
                value={data?.stats.total_orders ?? 0}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="已支付订单"
                value={data?.stats.paid_orders ?? 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总收入"
                value={formatCents(data?.stats.total_revenue ?? 0)}
                prefix={<DollarOutlined />}
                valueStyle={{ color: "#1677ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="支付成功率"
                value={((data?.stats.success_rate ?? 0) * 100).toFixed(1)}
                suffix="%"
                prefix={<PercentageOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}
    </DeveloperLayout>
  );
}
