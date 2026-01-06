import type { HTMLAttributes, ReactNode } from 'react';
import './badge.css';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: ReactNode;
}

export const Badge = ({
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  className = '',
  ...props
}: BadgeProps) => {
  const classNames = [
    'ui-badge',
    `ui-badge--${variant}`,
    `ui-badge--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames} {...props}>
      {dot && <span className="ui-badge__dot" />}
      {children}
    </span>
  );
};
