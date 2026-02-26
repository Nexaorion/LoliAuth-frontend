"use client";

import React from "react";
import { Descriptions, Tag, Typography, Button, Space } from "antd";
import { SecurityScanOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useAuthStore } from "@/stores/authStore";

const { Title } = Typography;

const statusMap: Record<string, { color: string; text: string }> = {
  active: { color: "green", text: "正常" },
  disabled: { color: "red", text: "已禁用" },
  suspended: { color: "orange", text: "已暂停" },
};

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const status = user?.status ? statusMap[user.status] : null;

  return (
    <AppLayout>
      <Title level={3}>个人信息</Title>
      <Descriptions bordered column={1} style={{ marginTop: 16 }}>
        <Descriptions.Item label="用户 ID">{user?.id ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="邮箱">{user?.email ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="账户状态">
          {status ? <Tag color={status.color}>{status.text}</Tag> : "—"}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {user?.created_at
            ? new Date(user.created_at).toLocaleString("zh-CN")
            : "—"}
        </Descriptions.Item>
        <Descriptions.Item label="更新时间">
          {user?.updated_at
            ? new Date(user.updated_at).toLocaleString("zh-CN")
            : "—"}
        </Descriptions.Item>
      </Descriptions>
      <Space style={{ marginTop: 24 }}>
        <Button
          icon={<SecurityScanOutlined />}
          type="primary"
          onClick={() => router.push("/security")}
        >
          安全中心
        </Button>
      </Space>
    </AppLayout>
  );
}
