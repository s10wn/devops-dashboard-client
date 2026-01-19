import { useQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { ME_QUERY } from '@entities/user';
import { useAuthStore } from '@shared/lib/stores/auth-store';
import { Dropdown, DropdownItem, DropdownDivider, Skeleton } from '@shared/ui';
import type { User } from '@shared/types';
import './header.css';

type MeData = {
  me: User;
};

export const Header = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const { data, loading } = useQuery<MeData>(ME_QUERY);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const user = data?.me;

  return (
    <header className="header">
      <div className="header__search">
        <svg className="header__search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="7" cy="7" r="4" />
          <path d="M10 10l3 3" />
        </svg>
        <input type="text" placeholder="Поиск..." className="header__search-input" />
        <span className="header__search-shortcut">
          <kbd>/</kbd>
        </span>
      </div>

      <div className="header__actions">
        <button type="button" className="header__icon-btn" aria-label="Уведомления">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 2a6 6 0 016 6v3l2 2v1H2v-1l2-2V8a6 6 0 016-6z" />
            <path d="M8 17a2 2 0 004 0" />
          </svg>
          <span className="header__notification-dot" />
        </button>

        <button type="button" className="header__icon-btn" aria-label="Помощь">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="10" cy="10" r="8" />
            <path d="M7.5 7.5a2.5 2.5 0 013.5 2.5c0 1.5-2 2-2 3" />
            <circle cx="10" cy="15" r="0.5" fill="currentColor" />
          </svg>
        </button>

        <div className="header__divider" />

        <Dropdown
          align="right"
          trigger={
            <button type="button" className="header__user">
              {loading ? (
                <Skeleton variant="rectangular" width={36} height={36} />
              ) : (
                <>
                  <div className="header__avatar">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} />
                    ) : (
                      <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                  </div>
                  <div className="header__user-info">
                    <span className="header__user-name">{user?.name || 'User'}</span>
                    <span className="header__user-role">Admin</span>
                  </div>
                  <svg className="header__user-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </>
              )}
            </button>
          }
        >
          <div className="header__dropdown-header">
            <div className="header__dropdown-name">{user?.name}</div>
            <div className="header__dropdown-email">{user?.email}</div>
          </div>
          <DropdownDivider />
          <DropdownItem onClick={() => navigate('/settings')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="2.5" />
              <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.76 3.76l1.06 1.06M11.18 11.18l1.06 1.06M3.76 12.24l1.06-1.06M11.18 4.82l1.06-1.06" />
            </svg>
            Настройки
          </DropdownItem>
          <DropdownItem onClick={() => navigate('/settings')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="5" r="3" />
              <path d="M2 14c0-2.5 2.5-4.5 6-4.5s6 2 6 4.5" />
            </svg>
            Профиль
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem danger onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M6 8h8" />
            </svg>
            Выйти
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
};
