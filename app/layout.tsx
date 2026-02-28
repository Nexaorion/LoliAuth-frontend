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
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
      <meta name="cryptomus" content="a41157c1" />
      <link rel="icon" href="/Nexaorion-Logo-purple.png" type="image/png" />
      <title>LoliAuth</title>
    </head>
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