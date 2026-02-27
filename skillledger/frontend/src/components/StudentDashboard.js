import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SkillGraph from './SkillGraph';

const StudentDashboard = ({ user, token }) => {
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({ name: '', category: '', proficiencyLevel: 1 });
  const [challenges, setChallenges] = useState([]);
  const [scores, setScores] = useState({ current: 0, history: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const skillsRes = await axios.get('http://localhost:5000/api/skills/my-skills', config);
      const scoresRes = await axios.get('http://localhost:5000/api/users/scores', config);
      setSkills(skillsRes.data);
      setScores(scoresRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('http://localhost:5000/api/skills/add', newSkill, config);
      fetchUserData();
      setNewSkill({ name: '', category: '', proficiencyLevel: 1 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleProficiencyChange = async (skillId, newLevel) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`http://localhost:5000/api/skills/${skillId}`, { proficiencyLevel: newLevel }, config);
      fetchUserData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="student-dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {user.name}</h1>
        <div className="credibility-score">
          <h3>Credibility Score</h3>
          <div className="score-display">{scores.current}</div>
        </div>
      </header>

      <section className="skills-section">
        <h2>My Skills</h2>
        <div className="add-skill-form">
          <form onSubmit={handleAddSkill}>
            <input
              type="text"
              placeholder="Skill Name"
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              required
            />
            <select
              value={newSkill.category}
              onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
              required
            >
              <option value="">Select Category</option>
              <option value="programming">Programming</option>
              <option value="design">Design</option>
              <option value="marketing">Marketing</option>
              <option value="communication">Communication</option>
              <option value="analytics">Analytics</option>
            </select>
            <select
              value={newSkill.proficiencyLevel}
              onChange={(e) => setNewSkill({ ...newSkill, proficiencyLevel: parseInt(e.target.value) })}
            >
              <option value="1">Beginner</option>
              <option value="2">Elementary</option>
              <option value="3">Intermediate</option>
              <option value="4">Advanced</option>
              <option value="5">Expert</option>
            </select>
            <button type="submit">Add Skill</button>
          </form>
        </div>

        <div className="skills-grid">
          {skills.map((skill) => (
            <div key={skill._id} className="skill-card">
              <h3>{skill.name}</h3>
              <span className="skill-category">{skill.category}</span>
              <div className="skill-proficiency">
                <label>Proficiency: {skill.proficiencyLevel}/5</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={skill.proficiencyLevel}
                  onChange={(e) => handleProficiencyChange(skill._id, e.target.value)}
                />
              </div>
              <div className="skill-score">Score: {skill.score}</div>
              {skill.verified && <span className="verified-badge">✓ Verified</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="graph-section">
        <h2>Skill Graph Visualization</h2>
        <SkillGraph skills={skills} />
      </section>

      <section className="challenges-section">
        <h2>Micro Skill Challenges</h2>
        <div className="challenges-list">
          {challenges.length === 0 ? (
            <p>No challenges available. Check back later!</p>
          ) : (
            challenges.map((challenge) => (
              <div key={challenge._id} className="challenge-card">
                <h4>{challenge.title}</h4>
                <p>{challenge.description}</p>
                <span className="skill-tag">{challenge.skillName}</span>
                <button>Attempt Challenge</button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="evolution-section">
        <h2>Skill Evolution Over Time</h2>
        <div className="evolution-chart">
          {scores.history.length > 0 ? (
            scores.history.map((entry, index) => (
              <div key={index} className="evolution-point">
                <span className="date">{new Date(entry.date).toLocaleDateString()}</span>
                <span className="score">{entry.score}</span>
              </div>
            ))
          ) : (
            <p>No history available yet. Start adding skills!</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default StudentDashboard;
