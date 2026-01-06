import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import './input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

    const wrapperClassNames = [
      'ui-input-wrapper',
      fullWidth && 'ui-input-wrapper--full',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const inputClassNames = [
      'ui-input',
      error && 'ui-input--error',
      leftIcon && 'ui-input--with-left-icon',
      rightIcon && 'ui-input--with-right-icon',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClassNames}>
        {label && (
          <label className="ui-input__label" htmlFor={inputId}>
            {label}
          </label>
        )}
        <div className="ui-input__container">
          {leftIcon && <span className="ui-input__icon ui-input__icon--left">{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={inputClassNames}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon && <span className="ui-input__icon ui-input__icon--right">{rightIcon}</span>}
        </div>
        {error && (
          <span id={`${inputId}-error`} className="ui-input__error" role="alert">
            {error}
          </span>
        )}
        {!error && hint && (
          <span id={`${inputId}-hint`} className="ui-input__hint">
            {hint}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
