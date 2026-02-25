import React from "react";
import { Button, Result } from "antd";
import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在"
        extra={
          <Link href="/">
            <Button type="primary">返回首页</Button>
          </Link>
        }
      />
    </div>
  );
}
