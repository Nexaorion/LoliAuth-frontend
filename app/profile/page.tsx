"use client";

import React, { useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Avatar,
  Divider,
  Select,
  DatePicker,
} from "antd";
import md5 from "md5";
import dayjs from "dayjs";
import AppLayout from "@/components/layout/AppLayout";
import { useAuthStore } from "@/stores/authStore";
import { updateProfile } from "@/lib/api/account";
import type { UpdateProfileRequest } from "@/types";

const { Title, Text } = Typography;

const TIMEZONES = [
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Pacific/Auckland",
  "Pacific/Honolulu",
  "UTC",
];

function gravatarUrl(email?: string): string | undefined {
  if (!email) return undefined;
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?s=128&d=404`;
}

function avatarLetter(email?: string) {
  if (!email) return "U";
  return email[0].toUpperCase();
}

export default function ProfilePage() {
  const { user, loadProfile } = useAuthStore();
  const [form] = Form.useForm();
  const [saving, setSaving] = React.useState(false);
  const [avatarPreview, setAvatarPreview] = React.useState<string | undefined>();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        family_name: user.family_name ?? "",
        given_name: user.given_name ?? "",
        name: user.name ?? "",
        timezone: user.timezone ?? undefined,
        avatar_url: user.avatar_url ?? "",
        profile_url: user.profile_url ?? "",
        birthdate: user.birthdate ? dayjs(user.birthdate) : null,
      });
      setAvatarPreview(user.avatar_url || undefined);
    }
  }, [user, form]);

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload: UpdateProfileRequest = {
        family_name: values.family_name || "",
        given_name: values.given_name || "",
        name: values.name || "",
        timezone: values.timezone || "",
        avatar_url: values.avatar_url || "",
        profile_url: values.profile_url || "",
        birthdate: values.birthdate
          ? (values.birthdate as dayjs.Dayjs).format("YYYY-MM-DD")
          : "",
      };
      await updateProfile(payload);
      await loadProfile();
      message.success("个人信息已更新");
    } catch {
      message.error("保存失败，请稍后再试");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <Title level={3} style={{ marginBottom: 24 }}>
        个人信息
      </Title>

      <Card variant="outlined" style={{ maxWidth: 560 }}>
        {/* 头像预览 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <Avatar
            size={64}
            src={avatarPreview || gravatarUrl(user?.email)}
            style={{
              background: "#8c8c8c",
              fontWeight: 600,
              fontSize: 24,
              flexShrink: 0,
            }}
          >
            {avatarLetter(user?.email)}
          </Avatar>
          <div>
            <Text strong style={{ display: "block", fontSize: 15 }}>
              {user?.name ||
                user?.given_name ||
                user?.email?.split("@")[0] ||
                "用户"}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {user?.email}
            </Text>
          </div>
        </div>

        <Divider style={{ margin: "0 0 20px" }} />

        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="family_name"
            label="姓"
            rules={[{ max: 100, message: "最多 100 个字符" }]}
          >
            <Input placeholder="请输入姓" maxLength={100} />
          </Form.Item>

          <Form.Item
            name="given_name"
            label="名"
            rules={[{ max: 100, message: "最多 100 个字符" }]}
          >
            <Input placeholder="请输入名" maxLength={100} />
          </Form.Item>

          <Form.Item
            name="name"
            label="全名"
            rules={[{ max: 100, message: "最多 100 个字符" }]}
          >
            <Input placeholder="请输入全名（显示名称）" maxLength={100} />
          </Form.Item>

          <Form.Item name="birthdate" label="生日">
            <DatePicker
              style={{ width: "100%" }}
              placeholder="选择生日"
              disabledDate={(d) => d.isAfter(dayjs())}
            />
          </Form.Item>

          <Form.Item name="timezone" label="时区">
            <Select
              placeholder="选择时区"
              allowClear
              showSearch
              options={TIMEZONES.map((tz) => ({ label: tz, value: tz }))}
            />
          </Form.Item>

          <Form.Item
            name="avatar_url"
            label="头像链接"
            rules={[
              { type: "url", message: "请输入有效的 URL", warningOnly: true },
            ]}
          >
            <Input
              placeholder="https://example.com/avatar.jpg"
              onChange={(e) => setAvatarPreview(e.target.value || undefined)}
            />
          </Form.Item>

          <Form.Item
            name="profile_url"
            label="个人主页"
            rules={[
              { type: "url", message: "请输入有效的 URL", warningOnly: true },
            ]}
          >
            <Input placeholder="https://example.com" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button type="primary" loading={saving} onClick={handleSave} block>
              保存更改
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </AppLayout>
  );
}