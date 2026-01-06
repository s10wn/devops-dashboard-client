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
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="7" cy="7" r="4" />
          <path d="M10 10l3 3" />
        </svg>
        <input type="text" placeholder="Поиск..." className="header__search-input" />
      </div>

      <div className="header__actions">
        <button type="button" className="header__icon-btn" aria-label="Уведомления">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 2a6 6 0 016 6v3l2 2v1H2v-1l2-2V8a6 6 0 016-6z" />
            <path d="M8 17a2 2 0 004 0" />
          </svg>
        </button>

        <Dropdown
          align="right"
          trigger={
            <button type="button" className="header__user">
              {loading ? (
                <Skeleton variant="circular" width={32} height={32} />
              ) : (
                <>
                  <div className="header__avatar">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} />
                    ) : (
                      <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                  </div>
                  <span className="header__user-name">{user?.name || 'Пользователь'}</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
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
            Настройки
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem danger onClick={handleLogout}>
            Выйти
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
};
