import { useAuthStore } from '@shared/lib/stores/auth-store';
import { Card, CardBody, Input } from '@shared/ui';
import './settings.css';

export const SettingsPage = () => {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="settings">
      <h1>Настройки</h1>

      <div className="settings__content">
        <ProfileSettings user={user} />
      </div>
    </div>
  );
};

type ProfileSettingsProps = {
  user: { id: string; name: string; email: string } | null;
};

const ProfileSettings = ({ user }: ProfileSettingsProps) => {
  return (
    <div className="settings__section">
      <div className="settings__section-header">
        <h2 className="settings__section-title">Профиль</h2>
        <p className="settings__section-desc">Управление вашим аккаунтом</p>
      </div>

      <Card>
        <CardBody>
          <div className="settings__form">
            <Input label="Имя" value={user?.name || ''} disabled />
            <Input label="Email" value={user?.email || ''} disabled />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Для изменения профиля обратитесь к администратору
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
