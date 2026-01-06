import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import './button.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const classNames = [
      'ui-button',
      `ui-button--${variant}`,
      `ui-button--${size}`,
      fullWidth && 'ui-button--full',
      loading && 'ui-button--loading',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classNames}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <span className="ui-button__spinner" />}
        {!loading && leftIcon && <span className="ui-button__icon">{leftIcon}</span>}
        <span className="ui-button__text">{children}</span>
        {!loading && rightIcon && <span className="ui-button__icon">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
