"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Statistic,
  Button,
  Table,
  Tag,
  Modal,
  Form,
  InputNumber,
  Input,
  Checkbox,
  message,
  Spin,
  Empty,
  Space,
  Typography,
  Grid,
  Tabs,
  Popover,
} from "antd";
import {
  WalletOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  HistoryOutlined,
  ReloadOutlined,
  PoweroffOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AppLayout from "@/components/layout/AppLayout";
import PolicyModal from "@/components/ui/PolicyModal";
import {
  getWallet,
  activateWallet,
  deactivateWallet,
  deposit,
  withdraw,
  getTransactions,
  getWithdrawals,
  getWithdrawalDetail,
} from "@/lib/api/billing";
import type { Wallet, WalletTransaction, Withdrawal } from "@/types";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const TX_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  deposit: { label: "充值", color: "green" },
  withdrawal: { label: "提现", color: "orange" },
  payment_sent: { label: "支付", color: "red" },
  payment_received: { label: "收款", color: "blue" },
  subscription_charge: { label: "订阅扣费", color: "volcano" },
  refund: { label: "退款", color: "cyan" },
};

const WITHDRAWAL_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "待审核", color: "processing" },
  approved: { label: "已通过", color: "success" },
  rejected: { label: "已拒绝", color: "error" },
};

export default function BalancePage() {
  const screens = useBreakpoint();
  const isMobile = screens.md === false;

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [notActivated, setNotActivated] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [policyModal, setPolicyModal] = useState<"balance" | "crossBorder" | null>(null);
  const [readStatus, setReadStatus] = useState({ balance: false, crossBorder: false });
  const [activationForm] = Form.useForm();

  // Deactivate
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);

  // Withdrawal rejection reason
  const [rejectReasonMap, setRejectReasonMap] = useState<Record<string, string | null>>({});
  const [loadingReasonId, setLoadingReasonId] = useState<string | null>(null);

  // Transactions
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txLoading, setTxLoading] = useState(false);

  // Withdrawals
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [wdTotal, setWdTotal] = useState(0);
  const [wdPage, setWdPage] = useState(1);
  const [wdLoading, setWdLoading] = useState(false);

  // Modals
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const [depositForm] = Form.useForm();
  const [withdrawForm] = Form.useForm();

  const fetchWallet = useCallback(async () => {
    try {
      const w = await getWallet();
      if (!w.activated) {
        setNotActivated(true);
        setWallet(null);
      } else {
        setWallet(w);
        setNotActivated(false);
      }
    } catch {
      setNotActivated(true);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(
    async (page = 1) => {
      setTxLoading(true);
      try {
        const res = await getTransactions({ page, page_size: 10 });
        setTransactions(res.data);
        setTxTotal(res.total);
      } catch {
        // ignore
      } finally {
        setTxLoading(false);
      }
    },
    []
  );

  const fetchWithdrawals = useCallback(
    async (page = 1) => {
      setWdLoading(true);
      try {
        const res = await getWithdrawals({ page, page_size: 10 });
        setWithdrawals(res.data);
        setWdTotal(res.total);
      } catch {
        // ignore
      } finally {
        setWdLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    if (wallet?.activated) {
      fetchTransactions(1);
      fetchWithdrawals(1);
    }
  }, [wallet?.activated, fetchTransactions, fetchWithdrawals]);

  const handleActivate = async () => {
    try {
      await activationForm.validateFields();
    } catch {
      return;
    }

    setActivating(true);
    try {
      const w = await activateWallet();
      setWallet(w);
      setNotActivated(false);
      setActivateModalOpen(false);
      message.success("钱包开通成功");
    } catch {
      message.error("开通失败，请稍后再试");
    } finally {
      setActivating(false);
    }
  };

  const handleAgreePolicy = (type: "balance" | "crossBorder") => {
    const newStatus = { ...readStatus, [type]: true };
    setReadStatus(newStatus);

    if (type === "balance" && !newStatus.crossBorder) {
      setPolicyModal("crossBorder");
    } else if (type === "crossBorder" && !newStatus.balance) {
      setPolicyModal("balance");
    } else {
      setPolicyModal(null);
      activationForm.setFieldsValue({ agreement: true });
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await deactivateWallet();
      message.success("钱包已停用");
      setDeactivateModalOpen(false);
      setWallet(null);
      setNotActivated(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      const code = error?.response?.data?.error;
      if (code === "active_subscription_exists") {
        message.error("存在激活中的订阅，请先取消所有订阅后再停用");
      } else if (code === "outstanding_bill_exists") {
        message.error("存在未结清的待支付订单，请先处理后再停用");
      } else if (code === "non_zero_balance") {
        message.error("钱包余额不为零，请先提现所有余额后再停用");
      } else {
        message.error("停用失败，请稍后再试");
      }
    } finally {
      setDeactivating(false);
    }
  };

  const fetchRejectReason = async (withdrawalId: string) => {
    if (rejectReasonMap[withdrawalId] !== undefined) return;
    setLoadingReasonId(withdrawalId);
    try {
      const detail = await getWithdrawalDetail(withdrawalId);
      setRejectReasonMap((prev) => ({
        ...prev,
        [withdrawalId]: detail.admin_note || "管理员未填写拒绝原因",
      }));
    } catch {
      setRejectReasonMap((prev) => ({ ...prev, [withdrawalId]: "获取原因失败" }));
    } finally {
      setLoadingReasonId(null);
    }
  };

  const handleDeposit = async (values: { amount: number }) => {
    setDepositLoading(true);
    try {
      const amountCents = Math.round(values.amount * 100);
      await deposit({ amount: amountCents });
      message.success("充值成功");
      setDepositModalOpen(false);
      depositForm.resetFields();
      fetchWallet();
      fetchTransactions(txPage);
    } catch {
      message.error("充值失败，请稍后再试");
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async (values: {
    amount: number;
    address: string;
  }) => {
    setWithdrawLoading(true);
    try {
      const amountCents = Math.round(values.amount * 100);
      await withdraw({ amount: amountCents, address: values.address });
      message.success("提现申请已提交，请等待审核");
      setWithdrawModalOpen(false);
      withdrawForm.resetFields();
      fetchWallet();
      fetchWithdrawals(wdPage);
      fetchTransactions(txPage);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      if (error?.response?.data?.error === "insufficient_balance") {
        message.error("余额不足");
      } else {
        message.error("提现申请失败，请稍后再试");
      }
    } finally {
      setWithdrawLoading(false);
    }
  };

  const txColumns: ColumnsType<WalletTransaction> = [
    {
      title: "类型",
      dataIndex: "type",
      width: 110,
      render: (type: string) => {
        const info = TX_TYPE_LABELS[type] || { label: type, color: "default" };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: "金额",
      dataIndex: "amount",
      width: 120,
      render: (amount: number) => (
        <Text
          strong
          style={{ color: amount >= 0 ? "#52c41a" : "#ff4d4f" }}
        >
          {amount >= 0 ? "+" : ""}${(amount / 100).toFixed(2)}
        </Text>
      ),
    },
    {
      title: "余额",
      dataIndex: "balance",
      width: 120,
      render: (balance: number) => `$${(balance / 100).toFixed(2)}`,
    },
    {
      title: "描述",
      dataIndex: "description",
      ellipsis: true,
    },
    {
      title: "时间",
      dataIndex: "created_at",
      width: 180,
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
  ];

  const wdColumns: ColumnsType<Withdrawal> = [
    {
      title: "金额",
      dataIndex: "amount",
      width: 120,
      render: (amount: number) => (
        <Text strong>${(amount / 100).toFixed(2)}</Text>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 130,
      render: (status: string, record: Withdrawal) => {
        const info = WITHDRAWAL_STATUS[status] || {
          label: status,
          color: "default",
        };
        if (status !== "rejected") {
          return <Tag color={info.color}>{info.label}</Tag>;
        }
        const reason = rejectReasonMap[record.id];
        return (
          <Space size={4}>
            <Tag color={info.color}>{info.label}</Tag>
            <Popover
              title="拒绝原因"
              content={
                reason !== undefined ? (
                  <Text style={{ maxWidth: 240, display: "block" }}>{reason}</Text>
                ) : (
                  <Text type="secondary">加载中…</Text>
                )
              }
              trigger="click"
              onOpenChange={(open) => {
                if (open) fetchRejectReason(record.id);
              }}
            >
              <Button
                type="text"
                size="small"
                icon={
                  <InfoCircleOutlined
                    style={{ color: "#ff4d4f" }}
                  />
                }
                loading={loadingReasonId === record.id}
              />
            </Popover>
          </Space>
        );
      },
    },
    {
      title: "提现地址",
      dataIndex: "address",
      ellipsis: true,
    },
    {
      title: "备注",
      dataIndex: "note",
      ellipsis: true,
      render: (v: string) => v || "-",
    },
    {
      title: "申请时间",
      dataIndex: "created_at",
      width: 180,
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
          }}
        >
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

  if (notActivated) {
    return (
      <AppLayout>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
          }}
        >
          <Empty
            image={<WalletOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />}
            description="您尚未开通余额服务"
          >
            <Button type="primary" onClick={() => setActivateModalOpen(true)}>
              立即开通
            </Button>
          </Empty>
        </div>

        <Modal
          title="开通余额钱包"
          open={activateModalOpen}
          onCancel={() => setActivateModalOpen(false)}
          footer={null}
        >
          <p>
            开通余额钱包功能，您将可以使用余额进行充值、提现、支付等操作。
          </p>

          <PolicyModal
            title="余额服务协议"
            open={policyModal === "balance"}
            policyUrl="/policies/balance-agreement.md"
            onAgree={() => handleAgreePolicy("balance")}
            onCancel={() => setPolicyModal(null)}
          />
          <PolicyModal
            title="跨境数据传输协议"
            open={policyModal === "crossBorder"}
            policyUrl="/policies/cross-border-data-agreement.md"
            onAgree={() => handleAgreePolicy("crossBorder")}
            onCancel={() => setPolicyModal(null)}
          />

          <Form
            form={activationForm}
            onFinish={handleActivate}
            layout="vertical"
            style={{ marginTop: 24 }}
          >
            <Form.Item
              name="agreement"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value
                      ? Promise.resolve()
                      : Promise.reject(new Error("请先同意相关协议")),
                },
              ]}
            >
              <Checkbox>
                <span className="text-gray-600">
                  我已阅读并同意
                  <a
                    className="text-[#7c3aed] hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      setPolicyModal("balance");
                    }}
                    style={{ marginLeft: 4, cursor: "pointer" }}
                  >
                    《余额服务协议》
                  </a>
                  和
                  <a
                    className="text-[#7c3aed] hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      setPolicyModal("crossBorder");
                    }}
                    style={{ marginLeft: 4, cursor: "pointer" }}
                  >
                    《跨境数据传输协议》
                  </a>
                </span>
              </Checkbox>
            </Form.Item>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
              <Button onClick={() => setActivateModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={activating}>
                确认开通
              </Button>
            </div>
          </Form>
        </Modal>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 16 }}>
          <WalletOutlined style={{ marginRight: 8 }} />
          我的余额
        </Title>

        <Card>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 24,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Statistic
              title="可用余额"
              value={(wallet?.balance ?? 0) / 100}
              precision={2}
              prefix="$"
              valueStyle={{ fontSize: isMobile ? 28 : 36, fontWeight: 700 }}
            />
            <Space wrap>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setDepositModalOpen(true)}
              >
                充值
              </Button>
              <Button
                icon={<ArrowUpOutlined />}
                onClick={() => setWithdrawModalOpen(true)}
              >
                提现
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchWallet();
                  fetchTransactions(txPage);
                  fetchWithdrawals(wdPage);
                }}
              >
                刷新
              </Button>
              <Button
                danger
                icon={<PoweroffOutlined />}
                onClick={() => setDeactivateModalOpen(true)}
              >
                停用钱包
              </Button>
            </Space>
          </div>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">
              货币：{wallet?.currency?.toUpperCase() || "USD"} · 开通时间：
              {wallet?.activated_at
                ? new Date(wallet.activated_at).toLocaleString("zh-CN")
                : "-"}
            </Text>
          </div>
        </Card>
      </div>

      <Tabs
        defaultActiveKey="transactions"
        items={[
          {
            key: "transactions",
            label: (
              <span>
                <HistoryOutlined /> 交易记录
              </span>
            ),
            children: (
              <Table
                rowKey="id"
                columns={txColumns}
                dataSource={transactions}
                loading={txLoading}
                pagination={{
                  current: txPage,
                  total: txTotal,
                  pageSize: 10,
                  showSizeChanger: false,
                  showTotal: (total) => `共 ${total} 条`,
                  onChange: (page) => {
                    setTxPage(page);
                    fetchTransactions(page);
                  },
                }}
                scroll={{ x: 600 }}
              />
            ),
          },
          {
            key: "withdrawals",
            label: (
              <span>
                <ArrowUpOutlined /> 提现记录
              </span>
            ),
            children: (
              <Table
                rowKey="id"
                columns={wdColumns}
                dataSource={withdrawals}
                loading={wdLoading}
                pagination={{
                  current: wdPage,
                  total: wdTotal,
                  pageSize: 10,
                  showSizeChanger: false,
                  showTotal: (total) => `共 ${total} 条`,
                  onChange: (page) => {
                    setWdPage(page);
                    fetchWithdrawals(page);
                  },
                }}
                scroll={{ x: 600 }}
              />
            ),
          },
        ]}
      />

      <Modal
        title="充值"
        open={depositModalOpen}
        onCancel={() => {
          setDepositModalOpen(false);
          depositForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={depositForm}
          layout="vertical"
          onFinish={handleDeposit}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="amount"
            label="充值金额（USD）"
            rules={[
              { required: true, message: "请输入充值金额" },
              {
                type: "number",
                min: 0.01,
                message: "充值金额必须大于 0",
              },
            ]}
          >
            <InputNumber
              prefix="$"
              style={{ width: "100%" }}
              step={1}
              precision={2}
              placeholder="请输入金额"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setDepositModalOpen(false);
                  depositForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={depositLoading}>
                确认充值
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="申请提现"
        open={withdrawModalOpen}
        onCancel={() => {
          setWithdrawModalOpen(false);
          withdrawForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={withdrawForm}
          layout="vertical"
          onFinish={handleWithdraw}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="amount"
            label="提现金额（USD）"
            rules={[
              { required: true, message: "请输入提现金额" },
              {
                type: "number",
                min: 0.01,
                message: "提现金额必须大于 0",
              },
            ]}
          >
            <InputNumber
              prefix="$"
              style={{ width: "100%" }}
              step={1}
              precision={2}
              placeholder="请输入金额"
              max={wallet ? wallet.balance / 100 : undefined}
            />
          </Form.Item>
          <Form.Item
            name="address"
            label="提现地址"
            rules={[{ required: true, message: "请输入提现地址" }]}
          >
            <Input placeholder="请输入钱包地址" />
          </Form.Item>
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              提现申请提交后将进入审核流程，审核通过后资金将发放至指定地址。
            </Text>
          </div>
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setWithdrawModalOpen(false);
                  withdrawForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={withdrawLoading}
              >
                确认提现
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="停用钱包服务"
        open={deactivateModalOpen}
        onCancel={() => setDeactivateModalOpen(false)}
        onOk={handleDeactivate}
        okText="确认停用"
        okButtonProps={{ danger: true, loading: deactivating }}
        cancelText="取消"
      >
        <p>停用后您将无法进行充值、提现、支付等操作。</p>
        <p><strong>停用前请确保同时满足以下条件：</strong></p>
        <ul style={{ paddingLeft: 20, color: "rgba(0,0,0,0.65)" }}>
          <li>钱包余额为零（请先提现所有余额）</li>
          <li>无激活中的订阅服务</li>
          <li>无未结清的待支付订单</li>
        </ul>
      </Modal>
    </AppLayout>
  );
}
