import { Link } from 'react-router-dom';

export default function RegisterPage() {
  return (
    <div className="auth-form">
      <h1>Create account</h1>
      <p className="auth-form__subtitle">Start managing your DevOps</p>

      <form className="auth-form__form">
        <div className="form-field">
          <label htmlFor="name">Name</label>
          <input type="text" id="name" placeholder="John Doe" />
        </div>

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" placeholder="name@example.com" />
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input type="password" id="password" placeholder="••••••••" />
        </div>

        <button type="submit" className="btn btn--primary btn--full">
          Create account
        </button>
      </form>

      <p className="auth-form__footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
