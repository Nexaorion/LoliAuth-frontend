"use client";

import React from "react";
import Image from "next/image";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "LoliAuth";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export default function AuthLayout({
  title,
  subtitle,
  footer,
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f5] px-4 py-12">
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center">
        <Image
          src="/Nexaorion-Logo-purple.png"
          alt={APP_NAME}
          width={56}
          height={56}
          className="mb-4"
          priority
        />
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        )}
      </div>

      {/* Card */}
      <div className="w-full max-w-[420px] bg-white rounded-xl shadow-sm border border-gray-200 px-8 py-8">
        {children}
      </div>

      {/* Footer link */}
      {footer && (
        <div className="mt-6 text-sm text-gray-500">{footer}</div>
      )}

      {/* Branding */}
      <div className="mt-8 text-xs text-gray-400">&copy; {new Date().getFullYear()} {APP_NAME}</div>
    </div>
  );
}
