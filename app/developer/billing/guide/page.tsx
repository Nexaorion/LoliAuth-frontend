"use client";

import React from "react";
import { Typography, Alert, Card, Divider } from "antd";
import DeveloperLayout from "@/components/layout/DeveloperLayout";

const { Title, Paragraph, Text, Link } = Typography;

export default function DeveloperBillingGuidePage() {
  return (
    <DeveloperLayout>
      <Typography>
        <Title level={3}>支付接入说明</Title>

        <Alert
          type="info"
          showIcon
          message="金额单位"
          description="所有金额单位均为美分（cents），即 500 = $5.00 USD。"
          style={{ marginBottom: 24 }}
        />

        <Card style={{ marginBottom: 24 }}>
          <Title level={4}>1. 前置条件</Title>
          <Paragraph>
            <ul>
              <li>
                用户需先调用{" "}
                <Text code>POST /api/v1/billing/wallet/activate</Text>{" "}
                开通钱包才能进行支付。
              </li>
              <li>
                开发者需拥有至少一个已审核通过（<Text code>active</Text>{" "}
                状态）的 OAuth 应用。
              </li>
            </ul>
          </Paragraph>
        </Card>

        <Card style={{ marginBottom: 24 }}>
          <Title level={4}>2. 一次性支付（订单）</Title>
          <Paragraph>
            适用于单次购买场景，如购买许可证、虚拟商品等。
          </Paragraph>
          <Title level={5}>流程</Title>
          <Paragraph>
            <ol>
              <li>
                开发者调用{" "}
                <Text code>POST /api/v1/developer/billing/orders</Text>{" "}
                创建订单，指定 <Text code>client_id</Text>、
                <Text code>amount</Text>、<Text code>title</Text> 等参数。
              </li>
              <li>
                将订单 ID 返回给前端，引导用户跳转到 LoliAuth 支付页面完成付款。
              </li>
              <li>
                用户调用{" "}
                <Text code>POST /api/v1/billing/orders/:order_id/pay</Text>{" "}
                使用钱包余额完成支付。
              </li>
              <li>
                开发者可通过{" "}
                <Text code>
                  GET /api/v1/developer/billing/orders/:order_id/status
                </Text>{" "}
                轮询订单支付状态。
              </li>
            </ol>
          </Paragraph>

          <Title level={5}>创建订单请求示例</Title>
          <pre
            style={{
              background: "#f5f5f5",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
            }}
          >
{`POST /api/v1/developer/billing/orders
Authorization: Bearer <developer_token>
Content-Type: application/json

{
  "client_id": "your-client-id",
  "amount": 500,
  "title": "Premium License",
  "payer_id": "user-uuid",
  "expires_in": 3600
}`}
          </pre>

          <Title level={5}>退款</Title>
          <Paragraph>
            开发者可对已支付的订单调用{" "}
            <Text code>
              POST /api/v1/developer/billing/orders/:order_id/refund
            </Text>{" "}
            发起退款，资金将从开发者钱包退回付款方钱包。
          </Paragraph>
        </Card>

        <Card style={{ marginBottom: 24 }}>
          <Title level={4}>3. 周期性订阅</Title>
          <Paragraph>
            适用于 SaaS 订阅、会员制等需要定期扣费的场景。
          </Paragraph>

          <Title level={5}>流程</Title>
          <Paragraph>
            <ol>
              <li>
                开发者调用{" "}
                <Text code>POST /api/v1/developer/billing/plans</Text>{" "}
                创建订阅计划，指定 <Text code>interval_days</Text>{" "}
                定义计费周期。
              </li>
              <li>
                用户调用{" "}
                <Text code>
                  POST /api/v1/billing/subscriptions/:plan_id/subscribe
                </Text>{" "}
                订阅计划，首期费用立即扣除。
              </li>
              <li>系统在每个计费周期结束时自动续费。</li>
              <li>
                用户可调用{" "}
                <Text code>
                  POST /api/v1/billing/subscriptions/:subscription_id/cancel
                </Text>{" "}
                取消订阅（当前周期仍有效）。
              </li>
            </ol>
          </Paragraph>

          <Title level={5}>创建订阅计划示例</Title>
          <pre
            style={{
              background: "#f5f5f5",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
            }}
          >
{`POST /api/v1/developer/billing/plans
Authorization: Bearer <developer_token>
Content-Type: application/json

{
  "client_id": "your-client-id",
  "name": "Pro Monthly",
  "amount": 999,
  "interval_days": 30,
  "description": "Pro plan with all features"
}`}
          </pre>
        </Card>

        <Card style={{ marginBottom: 24 }}>
          <Title level={4}>4. 订单状态说明</Title>
          <Paragraph>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>
                    状态
                  </th>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>
                    说明
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px 12px" }}>
                    <Text code>pending</Text>
                  </td>
                  <td style={{ padding: "8px 12px" }}>待支付</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px 12px" }}>
                    <Text code>paid</Text>
                  </td>
                  <td style={{ padding: "8px 12px" }}>已支付</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px 12px" }}>
                    <Text code>cancelled</Text>
                  </td>
                  <td style={{ padding: "8px 12px" }}>已取消</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px 12px" }}>
                    <Text code>refunded</Text>
                  </td>
                  <td style={{ padding: "8px 12px" }}>已退款</td>
                </tr>
                <tr>
                  <td style={{ padding: "8px 12px" }}>
                    <Text code>expired</Text>
                  </td>
                  <td style={{ padding: "8px 12px" }}>已过期</td>
                </tr>
              </tbody>
            </table>
          </Paragraph>
        </Card>

        <Card>
          <Title level={4}>5. 订阅状态说明</Title>
          <Paragraph>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>
                    状态
                  </th>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>
                    说明
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px 12px" }}>
                    <Text code>active</Text>
                  </td>
                  <td style={{ padding: "8px 12px" }}>活跃中，自动续费</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px 12px" }}>
                    <Text code>cancelled</Text>
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    已取消，当前周期结束后不再续费
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px 12px" }}>
                    <Text code>expired</Text>
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    已过期（计划被停用）
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "8px 12px" }}>
                    <Text code>past_due</Text>
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    续费时余额不足
                  </td>
                </tr>
              </tbody>
            </table>
          </Paragraph>
        </Card>

        <Divider />
        <Paragraph type="secondary">
          更多 API 详情请参考{" "}
          <Link
            href="https://loliauth.apifox.cn"
            target="_blank"
          >
            LoliAuth API 文档
          </Link>
          。
        </Paragraph>
      </Typography>
    </DeveloperLayout>
  );
}
