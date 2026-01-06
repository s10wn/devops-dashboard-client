import { useState, useRef, useEffect, type ReactNode, type MouseEvent } from 'react';
import './dropdown.css';

type DropdownAlign = 'left' | 'right';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: DropdownAlign;
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  icon?: ReactNode;
}

interface DropdownDividerProps {
  className?: string;
}

export const Dropdown = ({ trigger, children, align = 'left' }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const handleTriggerClick = (e: MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="ui-dropdown" ref={dropdownRef}>
      <div className="ui-dropdown__trigger" onClick={handleTriggerClick}>
        {trigger}
      </div>
      {isOpen && (
        <div className={`ui-dropdown__menu ui-dropdown__menu--${align}`}>
          {children}
        </div>
      )}
    </div>
  );
};

export const DropdownItem = ({
  children,
  onClick,
  disabled = false,
  danger = false,
  icon,
}: DropdownItemProps) => {
  const classNames = [
    'ui-dropdown__item',
    disabled && 'ui-dropdown__item--disabled',
    danger && 'ui-dropdown__item--danger',
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <button
      type="button"
      className={classNames}
      onClick={handleClick}
      disabled={disabled}
    >
      {icon && <span className="ui-dropdown__item-icon">{icon}</span>}
      {children}
    </button>
  );
};

export const DropdownDivider = ({ className = '' }: DropdownDividerProps) => (
  <div className={`ui-dropdown__divider ${className}`} />
);

export const DropdownLabel = ({ children }: { children: ReactNode }) => (
  <div className="ui-dropdown__label">{children}</div>
);
