import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { LOGIN_MUTATION } from '@features/auth/api/mutations';
import { useAuthStore } from '@shared/lib/stores/auth-store';
import type { AuthResponse } from '@shared/types';

interface LoginData {
  login: AuthResponse;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [loginMutation, { loading }] = useMutation<LoginData>(LOGIN_MUTATION, {
    onCompleted: (data) => {
      const { tokens, userId, email, name } = data.login;
      login(
        { id: userId, email, name, emailVerified: false, isActive: true, createdAt: '', updatedAt: '' },
        tokens
      );
      navigate('/dashboard');
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation({ variables: { input: { email, password } } });
  };

  return (
    <div className="auth-form">
      <h1>Sign in</h1>
      <p className="auth-form__subtitle">Welcome back to DevOps Dashboard</p>

      <form className="auth-form__form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="auth-form__footer">
        Don't have an account? <Link to="/register">Sign up</Link>
      </p>
    </div>
  );
}
