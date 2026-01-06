import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react';
import './select.css';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  children: ReactNode;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      fullWidth = false,
      className = '',
      id,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).slice(2, 9)}`;

    const wrapperClassNames = [
      'ui-select-wrapper',
      fullWidth && 'ui-select-wrapper--full',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const selectClassNames = [
      'ui-select',
      error && 'ui-select--error',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClassNames}>
        {label && (
          <label className="ui-select__label" htmlFor={selectId}>
            {label}
          </label>
        )}
        <div className="ui-select__container">
          <select
            ref={ref}
            id={selectId}
            className={selectClassNames}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
            {...props}
          >
            {children}
          </select>
          <span className="ui-select__arrow">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 6l4 4 4-4" />
            </svg>
          </span>
        </div>
        {error && (
          <span id={`${selectId}-error`} className="ui-select__error" role="alert">
            {error}
          </span>
        )}
        {!error && hint && (
          <span id={`${selectId}-hint`} className="ui-select__hint">
            {hint}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
