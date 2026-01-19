import { NavLink } from 'react-router-dom';
import './sidebar.css';

type NavItem = {
  path: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Обзор',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="6" height="6" rx="1" />
        <rect x="11" y="3" width="6" height="6" rx="1" />
        <rect x="3" y="11" width="6" height="6" rx="1" />
        <rect x="11" y="11" width="6" height="6" rx="1" />
      </svg>
    ),
  },
  {
    path: '/projects',
    label: 'Проекты',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
        <path d="M7 10h6M7 14h4" />
      </svg>
    ),
  },
  {
    path: '/servers',
    label: 'Серверы',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="14" height="5" rx="1" />
        <rect x="3" y="12" width="14" height="5" rx="1" />
        <circle cx="6" cy="5.5" r="1" fill="currentColor" />
        <circle cx="6" cy="14.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    path: '/payments',
    label: 'Платежи',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="4" width="16" height="12" rx="2" />
        <path d="M2 8h16" />
        <path d="M6 12h4" />
      </svg>
    ),
  },
  {
    path: '/kanban',
    label: 'Канбан',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="4" height="14" rx="1" />
        <rect x="8" y="3" width="4" height="10" rx="1" />
        <rect x="13" y="3" width="4" height="6" rx="1" />
      </svg>
    ),
  },
  {
    path: '/settings',
    label: 'Настройки',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="10" cy="10" r="3" />
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
];

export const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        <span>DevOps</span>
      </div>

      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
            }
          >
            <span className="sidebar__nav-icon">{item.icon}</span>
            <span className="sidebar__nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
