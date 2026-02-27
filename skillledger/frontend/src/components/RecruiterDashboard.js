import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SkillGraph from './SkillGraph';

const RecruiterDashboard = ({ token }) => {
  const [candidates, setCandidates] = useState([]);
  const [filters, setFilters] = useState({ skills: '', minScore: 0 });
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(false);

  const searchCandidates = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const params = new URLSearchParams();
      if (filters.skills) params.append('skills', filters.skills);
      if (filters.minScore) params.append('minScore', filters.minScore);
      
      const response = await axios.get(`http://localhost:5000/api/recruiter/search?${params}`, config);
      setCandidates(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const viewCandidateProfile = async (candidateId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`http://localhost:5000/api/recruiter/candidate/${candidateId}`, config);
      setSelectedCandidate(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const downloadReport = async (candidateId) => {
    try {
      const config = { 
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      };
      const response = await axios.get(`http://localhost:5000/api/recruiter/report/${candidateId}`, config);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `skill-report-${candidateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="recruiter-dashboard">
      <header className="dashboard-header">
        <h1>Recruiter Dashboard</h1>
      </header>

      <section className="search-section">
        <h2>Search Candidates</h2>
        <div className="search-filters">
          <input
            type="text"
            placeholder="Skills (comma-separated)"
            value={filters.skills}
            onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
          />
          <input
            type="number"
            placeholder="Min Credibility Score"
            value={filters.minScore}
            onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
          />
          <button onClick={searchCandidates} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </section>

      <section className="candidates-section">
        <h2>Candidates</h2>
        <div className="candidates-grid">
          {candidates.map((candidate) => (
            <div key={candidate._id} className="candidate-card">
              <h3>{candidate.name}</h3>
              <p>{candidate.email}</p>
              <div className="candidate-score">
                <span>Credibility Score: {candidate.credibilityScore}</span>
              </div>
              <div className="candidate-skills">
                {candidate.skills?.slice(0, 3).map((skill) => (
                  <span key={skill._id} className="skill-tag">{skill.name}</span>
                ))}
              </div>
              <div className="candidate-actions">
                <button onClick={() => viewCandidateProfile(candidate._id)}>View Profile</button>
                <button onClick={() => downloadReport(candidate._id)}>Download Report</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedCandidate && (
        <section className="candidate-detail-section">
          <h2>Candidate Profile: {selectedCandidate.name}</h2>
          <div className="profile-info">
            <div className="profile-header">
              <h3>{selectedCandidate.name}</h3>
              <p>{selectedCandidate.email}</p>
              <p>{selectedCandidate.bio}</p>
            </div>
            <div className="profile-score">
              <h4>Credibility Score: {selectedCandidate.credibilityScore}</h4>
            </div>
            <div className="profile-skills">
              <h4>Skills</h4>
              <div className="skills-list">
                {selectedCandidate.skills?.map((skill) => (
                  <div key={skill._id} className="skill-detail">
                    <span className="skill-name">{skill.name}</span>
                    <span className="skill-level">Level: {skill.proficiencyLevel}/5</span>
                    <span className="skill-score">Score: {skill.score}</span>
                    {skill.verified && <span className="verified">✓</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="profile-graph">
              <h4>Skill Graph</h4>
              <SkillGraph skills={selectedCandidate.skills || []} />
            </div>
          </div>
          <button className="close-profile" onClick={() => setSelectedCandidate(null)}>
            Close Profile
          </button>
        </section>
      )}
    </div>
  );
};

export default RecruiterDashboard;
