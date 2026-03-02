"use client";

import React, { forwardRef, useImperativeHandle, useRef } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export interface HCaptchaWidgetRef {
  reset: () => void;
  execute: () => void;
}

interface HCaptchaWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: "light" | "dark";
  size?: "normal" | "compact" | "invisible";
}

const SITE_KEY = "3378bcea-9fde-41d8-9704-e3e201e6a5fe";

const HCaptchaWidget = forwardRef<HCaptchaWidgetRef, HCaptchaWidgetProps>(
  function HCaptchaWidget(
    { onVerify, onExpire, onError, theme = "light", size = "normal" },
    ref
  ) {
    const captchaRef = useRef<HCaptcha>(null);

    useImperativeHandle(ref, () => ({
      reset() {
        captchaRef.current?.resetCaptcha();
      },
      execute() {
        captchaRef.current?.execute();
      },
    }));

    return (
      <div style={size === "invisible" ? { display: "none" } : { display: "flex", justifyContent: "center", margin: "8px 0" }}>
        <HCaptcha
          ref={captchaRef}
          sitekey={SITE_KEY}
          theme={theme}
          size={size}
          onVerify={onVerify}
          onExpire={() => {
            onExpire?.();
          }}
          onError={() => {
            onError?.();
          }}
        />
      </div>
    );
  }
);

export default HCaptchaWidget;
