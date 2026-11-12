import { type ButtonHTMLAttributes, type InputHTMLAttributes } from "react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-stone-200/80 bg-white shadow-sm shadow-stone-200/50 ${className}`}
    >
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-base text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/20 ${props.className ?? ""}`}
    />
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-50 touch-manipulation";
  const variants = {
    primary: "bg-amber-800 text-white hover:bg-amber-900 active:bg-amber-950",
    secondary:
      "border border-stone-200 bg-white text-stone-800 hover:bg-stone-50",
    danger: "text-red-600 hover:bg-red-50 hover:text-red-700",
    ghost: "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
  };
  return (
    <button
      {...props}
      className={`${base} ${variants[variant]} ${className}`}
    />
  );
}

export function PageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-amber-50/90 via-stone-50 to-stone-100">
      {children}
    </div>
  );
}

export function Alert({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
}) {
  const styles =
    tone === "error"
      ? "bg-red-50 text-red-800 border-red-100"
      : "bg-emerald-50 text-emerald-800 border-emerald-100";
  return (
    <p className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>{children}</p>
  );
}
