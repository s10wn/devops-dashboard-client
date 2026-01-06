import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes, HTMLAttributes } from 'react';
import './table.css';

type SortDirection = 'asc' | 'desc' | null;

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

interface TableHeadProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
  hoverable?: boolean;
  selected?: boolean;
}

interface TableHeaderCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
  sortable?: boolean;
  sortDirection?: SortDirection;
  onSort?: () => void;
  width?: string | number;
}

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
}

interface TableEmptyProps {
  colSpan: number;
  children?: ReactNode;
}

export const Table = ({ children, className = '', ...props }: TableProps) => (
  <div className="ui-table-container">
    <table className={`ui-table ${className}`} {...props}>
      {children}
    </table>
  </div>
);

export const TableHead = ({ children, className = '', ...props }: TableHeadProps) => (
  <thead className={`ui-table__head ${className}`} {...props}>
    {children}
  </thead>
);

export const TableBody = ({ children, className = '', ...props }: TableBodyProps) => (
  <tbody className={`ui-table__body ${className}`} {...props}>
    {children}
  </tbody>
);

export const TableRow = ({
  children,
  hoverable = true,
  selected = false,
  className = '',
  ...props
}: TableRowProps) => {
  const classNames = [
    'ui-table__row',
    hoverable && 'ui-table__row--hoverable',
    selected && 'ui-table__row--selected',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <tr className={classNames} {...props}>
      {children}
    </tr>
  );
};

export const TableHeaderCell = ({
  children,
  sortable = false,
  sortDirection = null,
  onSort,
  width,
  className = '',
  style,
  ...props
}: TableHeaderCellProps) => {
  const classNames = [
    'ui-table__th',
    sortable && 'ui-table__th--sortable',
    sortDirection && `ui-table__th--sorted-${sortDirection}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = () => {
    if (sortable && onSort) {
      onSort();
    }
  };

  return (
    <th
      className={classNames}
      onClick={handleClick}
      style={{ ...style, width }}
      {...props}
    >
      <div className="ui-table__th-content">
        {children}
        {sortable && (
          <span className="ui-table__sort-icon">
            {sortDirection === 'asc' && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 3L10 8H2L6 3Z" />
              </svg>
            )}
            {sortDirection === 'desc' && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 9L2 4H10L6 9Z" />
              </svg>
            )}
            {!sortDirection && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" opacity="0.3">
                <path d="M6 2L9 5H3L6 2ZM6 10L3 7H9L6 10Z" />
              </svg>
            )}
          </span>
        )}
      </div>
    </th>
  );
};

export const TableCell = ({ children, className = '', ...props }: TableCellProps) => (
  <td className={`ui-table__td ${className}`} {...props}>
    {children}
  </td>
);

export const TableEmpty = ({ colSpan, children }: TableEmptyProps) => (
  <tr>
    <td colSpan={colSpan} className="ui-table__empty">
      {children || 'Нет данных'}
    </td>
  </tr>
);
