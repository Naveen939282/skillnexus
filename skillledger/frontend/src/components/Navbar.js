import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">SkillLedger</Link>
      </div>
      
      <div className="navbar-menu">
        <span className="user-info">
          Welcome, {user?.name}
          <span className={`role-badge ${user?.role}`}>{user?.role}</span>
        </span>
        
        <Link to="/" className="nav-link">Dashboard</Link>
        
        {user?.role === 'student' && (
          <Link to="/skills" className="nav-link">My Skills</Link>
        )}
        
        {user?.role === 'recruiter' && (
          <Link to="/search" className="nav-link">Search Talent</Link>
        )}
        
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
