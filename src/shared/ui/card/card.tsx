import type { HTMLAttributes, ReactNode } from 'react';
import './card.css';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardFooterAlign = 'left' | 'center' | 'right' | 'between';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: CardPadding;
  hoverable?: boolean;
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  action?: ReactNode;
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  align?: CardFooterAlign;
}

export const Card = ({
  children,
  padding = 'md',
  hoverable = false,
  className = '',
  ...props
}: CardProps) => {
  const classNames = [
    'ui-card',
    `ui-card--padding-${padding}`,
    hoverable && 'ui-card--hoverable',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({
  children,
  action,
  className = '',
  ...props
}: CardHeaderProps) => (
  <div className={`ui-card__header ${className}`} {...props}>
    <div className="ui-card__header-content">{children}</div>
    {action && <div className="ui-card__header-action">{action}</div>}
  </div>
);

export const CardBody = ({
  children,
  className = '',
  ...props
}: CardBodyProps) => (
  <div className={`ui-card__body ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({
  children,
  align = 'right',
  className = '',
  ...props
}: CardFooterProps) => {
  const classNames = [
    'ui-card__footer',
    `ui-card__footer--${align}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
};
