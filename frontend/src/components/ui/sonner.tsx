"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      position="bottom-center"
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        style: {
          background: "#1f2937",
          color: "#f9fafb",
          border: "1px solid #6DB33F",
          boxShadow:
            "0 18px 40px rgba(15, 23, 42, 0.28)",
        },
        className: "font-medium",
      }}
      {...props}
    />
  );
};

export { Toaster };
