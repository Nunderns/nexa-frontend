import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="landing-container">
      <main className="landing-card not-found-card">
        <p className="not-found-code">404</p>
        <h1 className="landing-title">Page not found</h1>
        <p className="landing-subtitle">That page does not exist or has moved.</p>
        <Link to="/home" className="btn btn-primary">
          Go to Nexa
        </Link>
      </main>
    </div>
  );
}