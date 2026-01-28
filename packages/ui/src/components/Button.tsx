import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button(props: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        padding: "0.75rem 1.5rem",
        borderRadius: "999px",
        border: "1px solid #00e5ff",
        background:
          "linear-gradient(135deg, rgba(0,188,212,0.2), rgba(0,0,0,0.8))",
        color: "#e0f7fa",
        cursor: "pointer"
      }}
    />
  );
}
