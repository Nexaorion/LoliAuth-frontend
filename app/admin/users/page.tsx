"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Tag,
  Button,
  Input,
  Select,
  Space,
  Typography,
  App,
  Popconfirm,
  Modal,
  Form,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  MailOutlined,
  LockOutlined,
  SendOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  getUsers,
  updateUser,
  deleteUser,
  getAdminKycStatus,
  adminChangeUserEmail,
  adminResetUserPassword,
} from "@/lib/api/admin";
import type { AdminUser, UpdateUserRequest, KycStatus } from "@/types";
import type { AxiosError } from "axios";
import type { ApiError } from "@/types";

const { Title } = Typography;

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "active", label: "正常" },
  { value: "disabled", label: "已禁用" },
  { value: "suspended", label: "已暂停" },
];

const roleOptions = [
  { value: "", label: "全部角色" },
  { value: "user", label: "用户" },
  { value: "admin", label: "管理员" },
];

const statusMap: Record<string, { color: string; text: string }> = {
  active: { color: "green", text: "正常" },
  disabled: { color: "red", text: "已禁用" },
  suspended: { color: "orange", text: "已暂停" },
};

const roleMap: Record<string, { color: string; text: string }> = {
  user: { color: "blue", text: "用户" },
  admin: { color: "purple", text: "管理员" },
};

const kycStatusMap: Record<string, { color: string; text: string }> = {
  none: { color: "default", text: "未认证" },
  pending: { color: "processing", text: "认证中" },
  success: { color: "success", text: "已实名" },
  failed: { color: "error", text: "认证失败" },
  expired: { color: "warning", text: "已过期" },
};

export default function AdminUsersPage() {
  const { message } = App.useApp();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [editModal, setEditModal] = useState<AdminUser | null>(null);
  const [kycCache, setKycCache] = useState<Record<string, KycStatus>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [form] = Form.useForm();
  const [emailModalUser, setEmailModalUser] = useState<AdminUser | null>(null);
  const [emailForm] = Form.useForm();
  const [emailLoading, setEmailLoading] = useState(false);
  const [resetPwdLoading, setResetPwdLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers({
        page,
        page_size: pageSize,
        ...(email && { email }),
        ...(status && { status }),
        ...(role && { role }),
      });
      setUsers(res.data);
      setTotal(res.total);
    } catch {
      message.error("加载用户列表失败");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, email, status, role, message]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (userId: string) => {
    try {
      await deleteUser(userId);
      message.success("用户已删除");
      fetchUsers();
    } catch {
      message.error("删除失败");
    }
  };

  const handleEdit = (user: AdminUser) => {
    setEditModal(user);
    form.setFieldsValue({ status: user.status, role: user.role });
  };

  const handleResetPassword = async (user: AdminUser) => {
    setResetPwdLoading(true);
    try {
      await adminResetUserPassword(user.id);
      message.success(`密码重置链接已发送至 ${user.email}`);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      if (error.response?.status === 429) {
        message.error("发送过于频繁，请等待 60 秒后再试");
      } else {
        message.error(error.response?.data?.error_description || "发送重置链接失败");
      }
    } finally {
      setResetPwdLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!emailModalUser) return;
    setEmailLoading(true);
    try {
      const values = await emailForm.validateFields();
      await adminChangeUserEmail(emailModalUser.id, { new_email: values.new_email });
      message.success("邮箱修改成功");
      setEmailModalUser(null);
      emailForm.resetFields();
      fetchUsers();
    } catch (err) {
      if ((err as { errorFields?: unknown }).errorFields) return;
      const error = err as AxiosError<ApiError>;
      const status = error.response?.status;
      if (status === 400) message.error("邮箱格式错误或与当前邮箱相同");
      else if (status === 409) message.error("该邮箱已被其他用户注册");
      else message.error(error.response?.data?.error_description || "修改邮箱失败");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editModal) return;
    setEditLoading(true);
    try {
      const values: UpdateUserRequest = form.getFieldsValue();
      await updateUser(editModal.id, values);
      message.success("用户已更新");
      setEditModal(null);
      fetchUsers();
    } catch {
      message.error("更新失败");
    } finally {
      setEditLoading(false);
    }
  };

  const columns: ColumnsType<AdminUser> = [
    { title: "邮箱", dataIndex: "email", key: "email" },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (s: string) => {
        const cfg = statusMap[s];
        return cfg ? <Tag color={cfg.color}>{cfg.text}</Tag> : s;
      },
    },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
      render: (r: string) => {
        const cfg = roleMap[r];
        return cfg ? <Tag color={cfg.color}>{cfg.text}</Tag> : r;
      },
    },
    {
      title: "KYC 次数",
      dataIndex: "kyc_attempts_remaining",
      key: "kyc_attempts_remaining",
    },
    {
      title: "实名状态",
      dataIndex: "kyc_status",
      key: "kyc_status",
      width: 120,
      render: (s: string, record: AdminUser) => {
        const cfg = kycStatusMap[s] || { color: "default", text: s };
        if (s === "success") {
          const cached = kycCache[record.id];
          const tooltipTitle = cached
            ? `姓名：${cached.id_name || "—"}\n身份证：${cached.id_number || "—"}`
            : "加载中...";
          return (
            <Tooltip
              title={<span style={{ whiteSpace: "pre-line" }}>{tooltipTitle}</span>}
              onOpenChange={(open) => {
                if (open && !kycCache[record.id]) {
                  getAdminKycStatus(record.id).then((kycData) => {
                    setKycCache((prev) => ({ ...prev, [record.id]: kycData }));
                  }).catch(() => {
                    // ignore
                  });
                }
              }}
            >
              <Tag color={cfg.color}>{cfg.text}</Tag>
            </Tooltip>
          );
        }
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "action",
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除此用户？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Title level={4}>用户管理</Title>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="搜索邮箱"
          prefix={<SearchOutlined />}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setPage(1);
          }}
          style={{ width: 200 }}
          allowClear
        />
        <Select
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={statusOptions}
          style={{ width: 120 }}
        />
        <Select
          value={role}
          onChange={(v) => {
            setRole(v);
            setPage(1);
          }}
          options={roleOptions}
          style={{ width: 120 }}
        />
      </Space>
      <Table
        columns={columns}
        dataSource={users}
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

      <Modal
        title="编辑用户"
        open={!!editModal}
        onCancel={() => setEditModal(null)}
        onOk={handleEditSubmit}
        confirmLoading={editLoading}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="status" label="状态">
            <Select
              options={[
                { value: "active", label: "正常" },
                { value: "disabled", label: "禁用" },
                { value: "suspended", label: "暂停" },
              ]}
            />
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Select
              options={[
                { value: "user", label: "用户" },
                { value: "admin", label: "管理员" },
              ]}
            />
          </Form.Item>
        </Form>

        <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16, marginTop: 8 }}>
          <Typography.Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
            安全操作
          </Typography.Text>
          <Space>
            <Popconfirm
              title="确认发送密码重置链接？"
              description={`将向 ${editModal?.email} 发送密码重置邮件`}
              onConfirm={() => editModal && handleResetPassword(editModal)}
            >
              <Button
                icon={<LockOutlined />}
                loading={resetPwdLoading}
              >
                重置密码
              </Button>
            </Popconfirm>
            <Button
              icon={<MailOutlined />}
              onClick={() => {
                if (editModal) {
                  setEmailModalUser(editModal);
                  emailForm.setFieldsValue({ new_email: "" });
                }
              }}
            >
              修改邮箱
            </Button>
          </Space>
        </div>
      </Modal>

      <Modal
        title="修改用户邮箱"
        open={!!emailModalUser}
        onCancel={() => {
          setEmailModalUser(null);
          emailForm.resetFields();
        }}
        onOk={handleChangeEmail}
        confirmLoading={emailLoading}
        okText="确认修改"
      >
        {emailModalUser && (
          <div style={{ marginBottom: 16 }}>
            <Typography.Text type="secondary">
              当前邮箱：{emailModalUser.email}
            </Typography.Text>
          </div>
        )}
        <Form form={emailForm} layout="vertical">
          <Form.Item
            name="new_email"
            label="新邮箱地址"
            rules={[
              { required: true, message: "请输入新邮箱" },
              { type: "email", message: "请输入有效的邮箱地址" },
            ]}
          >
            <Input
              prefix={<SendOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="请输入新的邮箱地址"
            />
          </Form.Item>
        </Form>
      </Modal>
    </AdminLayout>
  );
}
