"use client";

import React from "react";
import { Typography, Alert, Card, Divider } from "antd";
import AdminLayout from "@/components/layout/AdminLayout";

const { Title, Paragraph, Text } = Typography;

export default function AdminSubscriptionsPage() {
  return (
    <AdminLayout>
      <Title level={3}>订阅管理</Title>

      <Alert
        type="info"
        showIcon
        message="订阅概览"
        description="订阅由开发者通过 API 创建订阅计划，用户订阅后系统自动按周期扣费。管理员可通过订单管理页面查看订阅相关的扣费记录，并在需要时对相关订单进行退款操作。"
        style={{ marginBottom: 24 }}
      />

      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>订阅状态说明</Title>
        <Paragraph>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #f0f0f0" }}>
                <th style={{ textAlign: "left", padding: "10px 16px" }}>
                  状态
                </th>
                <th style={{ textAlign: "left", padding: "10px 16px" }}>
                  说明
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "10px 16px" }}>
                  <Text code>active</Text>
                </td>
                <td style={{ padding: "10px 16px" }}>
                  活跃中，系统将按计划周期自动从用户钱包扣费并转入开发者钱包
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "10px 16px" }}>
                  <Text code>cancelled</Text>
                </td>
                <td style={{ padding: "10px 16px" }}>
                  用户已取消，当前周期结束后不再续费
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "10px 16px" }}>
                  <Text code>expired</Text>
                </td>
                <td style={{ padding: "10px 16px" }}>
                  已过期（开发者停用了订阅计划）
                </td>
              </tr>
              <tr>
                <td style={{ padding: "10px 16px" }}>
                  <Text code>past_due</Text>
                </td>
                <td style={{ padding: "10px 16px" }}>
                  续费时用户钱包余额不足，等待补款
                </td>
              </tr>
            </tbody>
          </table>
        </Paragraph>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>订阅扣费流程</Title>
        <Paragraph>
          <ol style={{ lineHeight: 2.2 }}>
            <li>
              开发者调用 <Text code>POST /api/v1/developer/billing/plans</Text>{" "}
              创建订阅计划，定义计费金额和周期。
            </li>
            <li>
              用户调用{" "}
              <Text code>
                POST /api/v1/billing/subscriptions/:plan_id/subscribe
              </Text>{" "}
              发起订阅，首期费用立即从用户钱包扣除并转入开发者钱包。
            </li>
            <li>
              系统在每个计费周期结束时自动执行续费扣款，对应的交易类型为{" "}
              <Text code>subscription_charge</Text>。
            </li>
            <li>
              若续费时用户余额不足，订阅状态变为{" "}
              <Text code>past_due</Text>。
            </li>
            <li>
              管理员可通过 <strong>订单管理</strong>{" "}
              页面查看所有订阅相关的支付记录，并可对已支付的
              订单执行退款操作。
            </li>
          </ol>
        </Paragraph>
      </Card>

      <Card>
        <Title level={4}>管理操作指南</Title>
        <Paragraph>
          <ul style={{ lineHeight: 2.2 }}>
            <li>
              <strong>查看订阅扣费记录</strong>：前往 &quot;订单管理&quot;
              页面，订阅产生的扣费会作为普通订单记录在系统中。
            </li>
            <li>
              <strong>处理退款</strong>：在 &quot;订单管理&quot;
              页面可对已支付的订单进行退款，资金将从开发者钱包退回用户钱包。
            </li>
            <li>
              <strong>提现审核</strong>：在 &quot;订单管理&quot;
              页面的 &quot;提现审核&quot;
              标签页可查看和处理用户的提现申请。
            </li>
          </ul>
        </Paragraph>
      </Card>

      <Divider />
      <Paragraph type="secondary" style={{ textAlign: "center" }}>
        如需直接操作用户的订阅数据，请通过后端 API 或数据库管理工具进行。
      </Paragraph>
    </AdminLayout>
  );
}
