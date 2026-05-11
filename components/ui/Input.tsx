import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-amber-100 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-200/60 placeholder:text-gray-400 ${className}`}
      {...props}
    />
  );
}

export function TextArea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full min-h-[120px] rounded-xl border border-amber-100 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-200/60 placeholder:text-gray-400 ${className}`}
      {...props}
    />
  );
}
