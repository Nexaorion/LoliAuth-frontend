import React from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App as AntApp, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import "./globals.css";

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "LoliAuth",
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION || "OAuth 2.0 Identity Platform",
};

const RootLayout = ({ children }: React.PropsWithChildren) => (
  <html lang="zh-CN">
    <body>
      <AntdRegistry>
        <ConfigProvider
          locale={zhCN}
          theme={{
            token: {
              borderRadius: 6,
              colorPrimary: "#7c3aed",
              colorInfo: "#7c3aed",
              wireframe: false,
            },
          }}
        >
          <AntApp>{children}</AntApp>
        </ConfigProvider>
      </AntdRegistry>
    </body>
  </html>
);

export default RootLayout;