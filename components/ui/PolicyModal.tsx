"use client";

import React, { useEffect, useRef, useState } from "react";
import { Modal, Button, Spin, Alert, Space, theme } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import MarkdownRenderer from "./MarkdownRenderer";

export interface PolicyModalProps {
  title: string;
  open: boolean;
  content?: string;
  policyUrl?: string;
  agreeText?: string;
  cancelText?: string;
  agreeLoading?: boolean;
  requireScroll?: boolean;
  onAgree: () => void;
  onCancel: () => void;
}

export default function PolicyModal({
  title,
  open,
  content,
  policyUrl,
  agreeText = "同意并继续",
  cancelText = "取消",
  agreeLoading = false,
  requireScroll = true,
  onAgree,
  onCancel,
}: PolicyModalProps) {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const [fetchedContent, setFetchedContent] = useState<string>("");
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  const scrollRef = useRef<HTMLDivElement>(null);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setHasScrolledToBottom(false);
      setFetchError(false);
      if (!content && policyUrl) {
        setFetchLoading(true);
      }
    }
  }

  const markdownContent = content ?? fetchedContent;
  const canAgree = !requireScroll || hasScrolledToBottom;

  // Fetch from URL when opened
  useEffect(() => {
    if (!open || content || !policyUrl) return;
    
    let isMounted = true;
    fetch(policyUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch policy");
        return res.text();
      })
      .then((text) => {
        if (isMounted) setFetchedContent(text);
      })
      .catch(() => {
        if (isMounted) setFetchError(true);
      })
      .finally(() => {
        if (isMounted) setFetchLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, policyUrl, content]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (hasScrolledToBottom) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Allow 24px tolerance at the bottom
    if (scrollTop + clientHeight >= scrollHeight - 24) {
      setHasScrolledToBottom(true);
    }
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      width={640}
      styles={{
        body: { padding: 0 },
      }}
      footer={
        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={onCancel}>{cancelText}</Button>
          <Button
            type="primary"
            icon={canAgree ? <CheckCircleOutlined /> : undefined}
            loading={agreeLoading}
            disabled={!canAgree}
            onClick={onAgree}
            title={
              !canAgree ? "请阅读完整协议后再点击同意" : undefined
            }
          >
            {agreeText}
          </Button>
        </Space>
      }
    >
      {requireScroll && !hasScrolledToBottom && !fetchLoading && markdownContent && (
        <div
          style={{
            padding: "6px 20px",
            background: "#fffbe6",
            borderBottom: "1px solid #ffe58f",
            fontSize: 12,
            color: "#d48806",
          }}
        >
          请滚动至底部阅读完整协议后，方可点击同意
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          maxHeight: 480,
          overflowY: "auto",
          padding: "20px 24px",
          background: colorBgContainer,
        }}
      >
        {fetchLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
            }}
          >
            <Spin />
          </div>
        ) : fetchError ? (
          <Alert
            type="error"
            message="协议内容加载失败"
            description="请检查网络连接后重试，或联系管理员。"
            showIcon
          />
        ) : markdownContent ? (
          <MarkdownRenderer content={markdownContent} />
        ) : (
          // Empty placeholder — waiting for content prop or fetch
          <div style={{ minHeight: 120 }} />
        )}
      </div>
    </Modal>
  );
}
