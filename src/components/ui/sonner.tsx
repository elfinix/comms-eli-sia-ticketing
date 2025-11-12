"use client";

import { useTheme } from "next-themes@0.4.6";
import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-gray-700',
          actionButton: 'group-[.toast]:bg-[#8B0000] group-[.toast]:text-white',
          cancelButton: 'group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600',
          success: 'group-[.toast]:text-green-600',
          error: 'group-[.toast]:text-red-600',
          warning: 'group-[.toast]:text-yellow-600',
          info: 'group-[.toast]:text-blue-600',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };