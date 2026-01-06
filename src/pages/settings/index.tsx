import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  TEAM_QUERY,
  MY_TEAMS_QUERY,
  UPDATE_TEAM_MUTATION,
  DELETE_TEAM_MUTATION,
  INVITE_TEAM_MEMBER_MUTATION,
  UPDATE_TEAM_MEMBER_ROLE_MUTATION,
  REMOVE_TEAM_MEMBER_MUTATION,
  LEAVE_TEAM_MUTATION,
  useTeamStore,
} from '@entities/team';
import { useAuthStore } from '@shared/lib/stores/auth-store';
import { Card, CardHeader, CardBody, Input, Button, Dropdown, DropdownItem, Skeleton } from '@shared/ui';
import './settings.css';

type Tab = 'profile' | 'team';

type TeamMember = {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
};

type TeamData = {
  team: {
    id: string;
    name: string;
    slug: string;
    members: TeamMember[];
  };
};

type UpdateTeamFormData = {
  name: string;
  slug: string;
};

type InviteFormData = {
  email: string;
};

type UpdateTeamData = {
  updateTeam: {
    id: string;
    name: string;
    slug: string;
  };
};

const updateTeamSchema = yup.object({
  name: yup.string().min(2, 'Минимум 2 символа').required('Обязательное поле'),
  slug: yup
    .string()
    .matches(/^[a-z0-9-]+$/, 'Только латиница, цифры и дефис')
    .min(2, 'Минимум 2 символа')
    .required('Обязательное поле'),
});

const inviteSchema = yup.object({
  email: yup.string().email('Некорректный email').required('Обязательное поле'),
});

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const currentTeam = useTeamStore((s) => s.currentTeam);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="settings">
      <h1>Настройки</h1>

      <div className="settings__tabs">
        <button
          type="button"
          className={`settings__tab ${activeTab === 'profile' ? 'settings__tab--active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Профиль
        </button>
        <button
          type="button"
          className={`settings__tab ${activeTab === 'team' ? 'settings__tab--active' : ''}`}
          onClick={() => setActiveTab('team')}
          disabled={!currentTeam}
        >
          Команда
        </button>
      </div>

      <div className="settings__content">
        {activeTab === 'profile' && <ProfileSettings user={user} />}
        {activeTab === 'team' && currentTeam && <TeamSettings teamId={currentTeam.id} userId={user?.id} />}
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

type TeamSettingsProps = {
  teamId: string;
  userId?: string;
};

const TeamSettings = ({ teamId, userId }: TeamSettingsProps) => {
  const setCurrentTeam = useTeamStore((s) => s.setCurrentTeam);
  const { data, loading, refetch } = useQuery<TeamData>(TEAM_QUERY, {
    variables: { id: teamId },
  });

  const team = data?.team;
  const currentMember = team?.members.find((m) => m.userId === userId);
  const isOwner = currentMember?.role === 'OWNER';
  const isAdmin = currentMember?.role === 'ADMIN' || isOwner;

  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    formState: { errors: updateErrors },
  } = useForm<UpdateTeamFormData>({
    resolver: yupResolver(updateTeamSchema),
    values: team ? { name: team.name, slug: team.slug } : undefined,
  });

  const {
    register: registerInvite,
    handleSubmit: handleSubmitInvite,
    reset: resetInvite,
    formState: { errors: inviteErrors },
  } = useForm<InviteFormData>({
    resolver: yupResolver(inviteSchema),
  });

  const [updateTeam, { loading: updating }] = useMutation<UpdateTeamData>(UPDATE_TEAM_MUTATION, {
    onCompleted: (data) => {
      setCurrentTeam(data.updateTeam);
      refetch();
    },
  });

  const [deleteTeam, { loading: deleting }] = useMutation(DELETE_TEAM_MUTATION, {
    refetchQueries: [{ query: MY_TEAMS_QUERY }],
    onCompleted: () => {
      setCurrentTeam(null);
    },
  });

  const [inviteMember, { loading: inviting }] = useMutation(INVITE_TEAM_MEMBER_MUTATION, {
    onCompleted: () => {
      resetInvite();
      refetch();
    },
  });

  const [updateMemberRole] = useMutation(UPDATE_TEAM_MEMBER_ROLE_MUTATION, {
    onCompleted: () => refetch(),
  });

  const [removeMember] = useMutation(REMOVE_TEAM_MEMBER_MUTATION, {
    onCompleted: () => refetch(),
  });

  const [leaveTeam, { loading: leaving }] = useMutation(LEAVE_TEAM_MUTATION, {
    refetchQueries: [{ query: MY_TEAMS_QUERY }],
    onCompleted: () => {
      setCurrentTeam(null);
    },
  });

  const onUpdateTeam = (formData: UpdateTeamFormData) => {
    updateTeam({
      variables: {
        input: { teamId, ...formData },
      },
    });
  };

  const onInvite = (formData: InviteFormData) => {
    inviteMember({
      variables: {
        input: { teamId, email: formData.email, role: 'MEMBER' },
      },
    });
  };

  const handleRoleChange = (memberId: string, newRole: 'ADMIN' | 'MEMBER') => {
    updateMemberRole({
      variables: {
        input: { teamId, memberId, role: newRole },
      },
    });
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm('Удалить участника из команды?')) {
      removeMember({
        variables: {
          input: { teamId, memberId },
        },
      });
    }
  };

  const handleLeaveTeam = () => {
    if (confirm('Вы уверены, что хотите покинуть команду?')) {
      leaveTeam({ variables: { teamId } });
    }
  };

  const handleDeleteTeam = () => {
    if (confirm('Вы уверены? Это действие нельзя отменить!')) {
      deleteTeam({ variables: { teamId } });
    }
  };

  if (loading) {
    return (
      <div className="settings__section">
        <Skeleton width="100%" height={200} variant="rectangular" />
      </div>
    );
  }

  if (!team) {
    return <div>Команда не найдена</div>;
  }

  return (
    <div className="settings__section">
      <div className="settings__section-header">
        <h2 className="settings__section-title">Настройки команды</h2>
        <p className="settings__section-desc">Управление командой «{team.name}»</p>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>Основные настройки</CardHeader>
          <CardBody>
            <form className="settings__form" onSubmit={handleSubmitUpdate(onUpdateTeam)}>
              <Input
                label="Название команды"
                error={updateErrors.name?.message}
                {...registerUpdate('name')}
              />
              <Input
                label="Slug (URL)"
                hint="Используется в URL"
                error={updateErrors.slug?.message}
                {...registerUpdate('slug')}
              />
              <div className="settings__form-actions">
                <Button type="submit" variant="primary" loading={updating}>
                  Сохранить
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>Участники ({team.members.length})</CardHeader>
        <CardBody>
          {isAdmin && (
            <form className="settings__invite" onSubmit={handleSubmitInvite(onInvite)}>
              <div className="settings__invite-input">
                <Input
                  placeholder="email@example.com"
                  error={inviteErrors.email?.message}
                  {...registerInvite('email')}
                />
              </div>
              <Button type="submit" variant="primary" loading={inviting}>
                Пригласить
              </Button>
            </form>
          )}

          <div className="settings__members" style={{ marginTop: 'var(--space-lg)' }}>
            {team.members.map((member) => (
              <div key={member.id} className="settings__member">
                <div className="settings__member-avatar">
                  {member.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="settings__member-info">
                  <div className="settings__member-name">{member.user.name}</div>
                  <div className="settings__member-email">{member.user.email}</div>
                </div>
                <span
                  className={`settings__member-role settings__member-role--${member.role.toLowerCase()}`}
                >
                  {member.role === 'OWNER' && 'Владелец'}
                  {member.role === 'ADMIN' && 'Админ'}
                  {member.role === 'MEMBER' && 'Участник'}
                </span>
                {isAdmin && member.role !== 'OWNER' && member.userId !== userId && (
                  <div className="settings__member-actions">
                    <Dropdown
                      trigger={
                        <Button size="sm" variant="ghost">
                          ...
                        </Button>
                      }
                    >
                      {member.role === 'MEMBER' && (
                        <DropdownItem onClick={() => handleRoleChange(member.id, 'ADMIN')}>
                          Сделать админом
                        </DropdownItem>
                      )}
                      {member.role === 'ADMIN' && (
                        <DropdownItem onClick={() => handleRoleChange(member.id, 'MEMBER')}>
                          Убрать из админов
                        </DropdownItem>
                      )}
                      <DropdownItem danger onClick={() => handleRemoveMember(member.id)}>
                        Удалить
                      </DropdownItem>
                    </Dropdown>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="settings__danger">
        <h3 className="settings__danger-title">Опасная зона</h3>

        {!isOwner && (
          <div className="settings__danger-item">
            <div className="settings__danger-text">
              <h4>Покинуть команду</h4>
              <p>Вы потеряете доступ к проектам и серверам команды</p>
            </div>
            <Button variant="danger" onClick={handleLeaveTeam} loading={leaving}>
              Покинуть
            </Button>
          </div>
        )}

        {isOwner && (
          <div className="settings__danger-item">
            <div className="settings__danger-text">
              <h4>Удалить команду</h4>
              <p>Все проекты, серверы и данные будут удалены навсегда</p>
            </div>
            <Button variant="danger" onClick={handleDeleteTeam} loading={deleting}>
              Удалить
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
