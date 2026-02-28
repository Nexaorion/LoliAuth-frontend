"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  fontSize?: number;
}

export default function MarkdownRenderer({
  content,
  fontSize = 14,
}: MarkdownRendererProps) {
  const baseStyle: React.CSSProperties = {
    fontSize,
    lineHeight: 1.8,
    color: "rgba(0,0,0,0.88)",
    wordBreak: "break-word",
  };

  const components: Components = {
    h1: ({ children }) => (
      <h1
        style={{
          fontSize: Math.round(fontSize * 1.71),
          fontWeight: 600,
          lineHeight: 1.4,
          margin: "24px 0 16px",
          paddingBottom: "0.3em",
          borderBottom: "1px solid #f0f0f0",
          color: "rgba(0,0,0,0.88)",
        }}
      >
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2
        style={{
          fontSize: Math.round(fontSize * 1.43),
          fontWeight: 600,
          lineHeight: 1.4,
          margin: "22px 0 12px",
          paddingBottom: "0.3em",
          borderBottom: "1px solid #f0f0f0",
          color: "rgba(0,0,0,0.88)",
        }}
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        style={{
          fontSize: Math.round(fontSize * 1.21),
          fontWeight: 600,
          lineHeight: 1.4,
          margin: "20px 0 10px",
          color: "rgba(0,0,0,0.88)",
        }}
      >
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4
        style={{
          fontSize,
          fontWeight: 600,
          lineHeight: 1.4,
          margin: "16px 0 8px",
          color: "rgba(0,0,0,0.88)",
        }}
      >
        {children}
      </h4>
    ),
    p: ({ children }) => (
      <p style={{ margin: "0 0 12px", color: "inherit" }}>{children}</p>
    ),
    strong: ({ children }) => (
      <strong style={{ fontWeight: 600, color: "rgba(0,0,0,0.88)" }}>
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em style={{ fontStyle: "italic" }}>{children}</em>
    ),
    ul: ({ children }) => (
      <ul
        style={{
          margin: "0 0 12px",
          paddingLeft: "1.5em",
          listStyleType: "disc",
        }}
      >
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol
        style={{
          margin: "0 0 12px",
          paddingLeft: "1.5em",
          listStyleType: "decimal",
        }}
      >
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li style={{ margin: "4px 0", lineHeight: 1.8 }}>{children}</li>
    ),
    blockquote: ({ children }) => (
      <blockquote
        style={{
          margin: "12px 0",
          padding: "8px 16px",
          borderLeft: "4px solid #1677ff",
          background: "#f0f5ff",
          borderRadius: "0 4px 4px 0",
          color: "rgba(0,0,0,0.65)",
        }}
      >
        {children}
      </blockquote>
    ),
    code: ({ inline, children, ...props }: { inline?: boolean; children?: React.ReactNode; className?: string }) =>
      inline ? (
        <code
          style={{
            padding: "1px 6px",
            background: "#f5f5f5",
            border: "1px solid #e8e8e8",
            borderRadius: 3,
            fontSize: "0.9em",
            fontFamily: '"SFMono-Regular", Consolas, monospace',
            color: "#c7254e",
          }}
          {...props}
        >
          {children}
        </code>
      ) : (
        <code
          style={{
            fontFamily: '"SFMono-Regular", Consolas, monospace',
            fontSize: "0.9em",
          }}
          {...props}
        >
          {children}
        </code>
      ),
    pre: ({ children }) => (
      <pre
        style={{
          margin: "12px 0",
          padding: "12px 16px",
          background: "#f5f5f5",
          border: "1px solid #e8e8e8",
          borderRadius: 6,
          overflowX: "auto",
          fontFamily: '"SFMono-Regular", Consolas, monospace',
          fontSize: "0.9em",
          lineHeight: 1.6,
        }}
      >
        {children}
      </pre>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#1677ff", textDecoration: "none" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.textDecoration = "underline")
        }
        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
      >
        {children}
      </a>
    ),
    hr: () => (
      <hr
        style={{
          margin: "20px 0",
          border: "none",
          borderTop: "1px solid #f0f0f0",
        }}
      />
    ),
    table: ({ children }) => (
      <div style={{ overflowX: "auto", margin: "12px 0" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize,
          }}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead style={{ background: "#fafafa" }}>{children}</thead>
    ),
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => (
      <tr
        style={{ borderBottom: "1px solid #f0f0f0" }}
      >
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th
        style={{
          padding: "8px 12px",
          textAlign: "left",
          fontWeight: 600,
          borderBottom: "2px solid #f0f0f0",
          color: "rgba(0,0,0,0.88)",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td
        style={{
          padding: "8px 12px",
          color: "rgba(0,0,0,0.65)",
        }}
      >
        {children}
      </td>
    ),
    img: ({ src, alt }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt ?? ""}
        style={{ maxWidth: "100%", borderRadius: 4, margin: "8px 0" }}
      />
    ),
  };

  return (
    <div style={baseStyle}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
