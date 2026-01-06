import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { REGISTER_MUTATION } from '@features/auth/api/mutations';
import { useAuthStore } from '@shared/lib/stores/auth-store';
import { Button, Input } from '@shared/ui';
import type { AuthResponse } from '@shared/types';

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
};

type RegisterData = {
  register: AuthResponse;
};

const registerSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Имя должно быть минимум 2 символа')
    .required('Имя обязательно'),
  email: yup
    .string()
    .email('Неверный формат email')
    .required('Email обязателен'),
  password: yup
    .string()
    .min(6, 'Пароль должен быть минимум 6 символов')
    .required('Пароль обязателен'),
});

export const RegisterPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
  });

  const [registerMutation, { loading, error }] = useMutation<RegisterData>(REGISTER_MUTATION, {
    onCompleted: (data) => {
      const { tokens, userId, email, name } = data.register;
      login(
        { id: userId, email, name, emailVerified: false, isActive: true, createdAt: '', updatedAt: '' },
        tokens
      );
      navigate('/dashboard');
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation({ variables: { input: data } });
  };

  return (
    <div className="auth-form">
      <h1>Регистрация</h1>
      <p className="auth-form__subtitle">Начните управлять вашей инфраструктурой</p>

      <form className="auth-form__form" onSubmit={handleSubmit(onSubmit)}>
        {error && <div className="form-error">{error.message}</div>}

        <Input
          label="Имя"
          type="text"
          placeholder="Иван Иванов"
          error={errors.name?.message}
          {...registerField('name')}
        />

        <Input
          label="Email"
          type="email"
          placeholder="name@example.com"
          error={errors.email?.message}
          {...registerField('email')}
        />

        <Input
          label="Пароль"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...registerField('password')}
        />

        <Button type="submit" variant="primary" fullWidth loading={loading}>
          Создать аккаунт
        </Button>
      </form>

      <p className="auth-form__footer">
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
};
