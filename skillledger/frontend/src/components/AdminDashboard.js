import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalSkills: 0, totalChallenges: 0 });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/users/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  return (
    <div className="dashboard admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-number">{stats.totalUsers}</p>
        </div>
        <div className="stat-card">
          <h3>Total Skills</h3>
          <p className="stat-number">{stats.totalSkills}</p>
        </div>
        <div className="stat-card">
          <h3>Total Challenges</h3>
          <p className="stat-number">{stats.totalChallenges}</p>
        </div>
      </div>

      <div className="users-table">
        <h2>All Users</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Credibility Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                <td>{user.credibilityScore}</td>
                <td>
                  <button className="btn-small">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;
