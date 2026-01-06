import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { REGISTER_MUTATION } from '@features/auth/api/mutations';
import { useAuthStore } from '@shared/lib/stores/auth-store';
import type { AuthResponse } from '@shared/types';

interface RegisterData {
  register: AuthResponse;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [registerMutation, { loading }] = useMutation<RegisterData>(REGISTER_MUTATION, {
    onCompleted: (data) => {
      const { tokens, userId, email, name } = data.register;
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
    registerMutation({ variables: { input: { name, email, password } } });
  };

  return (
    <div className="auth-form">
      <h1>Create account</h1>
      <p className="auth-form__subtitle">Start managing your DevOps</p>

      <form className="auth-form__form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-field">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

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
            minLength={6}
          />
        </div>

        <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
          {loading ? 'Creating...' : 'Create account'}
        </button>
      </form>

      <p className="auth-form__footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
