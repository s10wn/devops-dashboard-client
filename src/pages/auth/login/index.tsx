import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { LOGIN_MUTATION } from '@features/auth/api/mutations';
import { useAuthStore } from '@shared/lib/stores/auth-store';
import { Button, Input } from '@shared/ui';
import type { AuthResponse } from '@shared/types';

type LoginFormData = {
  email: string;
  password: string;
};

type LoginData = {
  login: AuthResponse;
};

const loginSchema = yup.object({
  email: yup
    .string()
    .email('Неверный формат email')
    .required('Email обязателен'),
  password: yup
    .string()
    .min(6, 'Пароль должен быть минимум 6 символов')
    .required('Пароль обязателен'),
});

export const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
  });

  const [loginMutation, { loading, error }] = useMutation<LoginData>(LOGIN_MUTATION, {
    onCompleted: (data) => {
      const { tokens, userId, email, name } = data.login;
      login(
        { id: userId, email, name, emailVerified: false, isActive: true, createdAt: '', updatedAt: '' },
        tokens
      );
      navigate('/dashboard');
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation({ variables: { input: data } });
  };

  return (
    <div className="auth-form">
      <h1>Вход</h1>
      <p className="auth-form__subtitle">Добро пожаловать в DevOps Dashboard</p>

      <form className="auth-form__form" onSubmit={handleSubmit(onSubmit)}>
        {error && <div className="form-error">{error.message}</div>}

        <Input
          label="Email"
          type="email"
          placeholder="name@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Пароль"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" variant="primary" fullWidth loading={loading}>
          Войти
        </Button>
      </form>

      <p className="auth-form__footer">
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </div>
  );
};
