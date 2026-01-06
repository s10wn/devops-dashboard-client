import { useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './modal.css';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';
type ModalFooterAlign = 'left' | 'center' | 'right' | 'between';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: ModalSize;
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
  resizable?: boolean;
}

interface ModalHeaderProps {
  children: ReactNode;
  onClose?: () => void;
}

interface ModalBodyProps {
  children: ReactNode;
}

interface ModalFooterProps {
  children: ReactNode;
  align?: ModalFooterAlign;
}

export const Modal = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  closeOnOverlay = true,
  closeOnEsc = true,
  resizable = false,
}: ModalProps) => {
  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEsc) {
        onClose();
      }
    },
    [onClose, closeOnEsc]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEsc]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlay) {
      onClose();
    }
  };

  const modalClasses = [
    'ui-modal',
    `ui-modal--${size}`,
    resizable && 'ui-modal--resizable',
  ]
    .filter(Boolean)
    .join(' ');

  const handleModalClick = (e: React.MouseEvent) => {
    // Prevent clicks inside modal from closing it (especially during resize)
    e.stopPropagation();
  };

  return createPortal(
    <div className="ui-modal__overlay" onClick={handleOverlayClick}>
      <div className={modalClasses} role="dialog" aria-modal="true" onClick={handleModalClick}>
        {children}
      </div>
    </div>,
    document.body
  );
};

export const ModalHeader = ({ children, onClose }: ModalHeaderProps) => (
  <div className="ui-modal__header">
    <div className="ui-modal__title">{children}</div>
    {onClose && (
      <button
        type="button"
        className="ui-modal__close"
        onClick={onClose}
        aria-label="Close modal"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M15 5L5 15M5 5l10 10" />
        </svg>
      </button>
    )}
  </div>
);

export const ModalBody = ({ children }: ModalBodyProps) => (
  <div className="ui-modal__body">{children}</div>
);

export const ModalFooter = ({ children, align = 'right' }: ModalFooterProps) => (
  <div className={`ui-modal__footer ui-modal__footer--${align}`}>
    {children}
  </div>
);
