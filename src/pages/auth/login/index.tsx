import { Link } from 'react-router-dom';

export default function LoginPage() {
  return (
    <div className="auth-form">
      <h1>Sign in</h1>
      <p className="auth-form__subtitle">Welcome back to DevOps Dashboard</p>

      <form className="auth-form__form">
        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" placeholder="name@example.com" />
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input type="password" id="password" placeholder="••••••••" />
        </div>

        <button type="submit" className="btn btn--primary btn--full">
          Sign in
        </button>
      </form>

      <p className="auth-form__footer">
        Don't have an account? <Link to="/register">Sign up</Link>
      </p>
    </div>
  );
}
