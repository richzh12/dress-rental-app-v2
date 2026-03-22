"use client";

import { useFormStatus } from "react-dom";

type FormSubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  className: string;
  disabled?: boolean;
};

export default function FormSubmitButton({
  label,
  pendingLabel,
  className,
  disabled = false,
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? pendingLabel ?? "Procesando..." : label}
    </button>
  );
}
