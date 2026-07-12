import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={`navbar ${user?.role === 'admin' ? 'navbar-admin' : ''}`}>
      <div className="navbar-brand">
        <Link to="/">🍽️ Reservations</Link>
        {user?.role === 'admin' && <span className="badge">ADMIN</span>}
      </div>
      <div className="navbar-links">
        {user ? (
          <>
            <span className="navbar-user">{user.name}</span>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
