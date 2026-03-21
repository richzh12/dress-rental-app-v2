'use client';

export interface BadgeProps {
  label: string;
  className?: string;
}

export function Badge({ label, className = '' }: BadgeProps) {
  const baseClass = 'atelier-badge inline-block whitespace-nowrap';
  return <span className={`${baseClass} ${className}`}>{label}</span>;
}

