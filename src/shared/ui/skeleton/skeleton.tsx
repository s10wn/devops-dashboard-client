import type { HTMLAttributes } from 'react';
import './skeleton.css';

type SkeletonVariant = 'text' | 'circular' | 'rectangular';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  animation?: boolean;
}

interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: string;
}

export const Skeleton = ({
  variant = 'text',
  width,
  height,
  animation = true,
  className = '',
  style,
  ...props
}: SkeletonProps) => {
  const classNames = [
    'ui-skeleton',
    `ui-skeleton--${variant}`,
    animation && 'ui-skeleton--animated',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const computedStyle = {
    ...style,
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height:
      height ??
      (variant === 'text' ? '1em' : variant === 'circular' ? width : undefined),
  };

  return <div className={classNames} style={computedStyle} {...props} />;
};

export const SkeletonText = ({ lines = 3, lastLineWidth = '70%' }: SkeletonTextProps) => (
  <div className="ui-skeleton-text">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === lines - 1 ? lastLineWidth : '100%'}
      />
    ))}
  </div>
);

export const SkeletonAvatar = ({ size = 40 }: { size?: number }) => (
  <Skeleton variant="circular" width={size} height={size} />
);

export const SkeletonButton = ({ width = 100, height = 36 }: { width?: number; height?: number }) => (
  <Skeleton variant="rectangular" width={width} height={height} />
);
