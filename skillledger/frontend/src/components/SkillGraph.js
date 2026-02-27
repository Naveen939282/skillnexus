import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

const SkillGraph = ({ skills }) => {
  const cyRef = useRef(null);

  useEffect(() => {
    if (!cyRef.current) {
      // Initialize Cytoscape
      cyRef.current = cytoscape({
        container: document.getElementById('cy'),
        style: [
          {
            selector: 'node',
            style: {
              'background-color': '#4a90e2',
              'label': 'data(label)',
              'color': '#333',
              'font-size': '12px',
              'text-valign': 'center',
              'text-halign': 'top',
              'width': 60,
              'height': 60
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 2,
              'line-color': '#ccc',
              'curve-style': 'bezier',
              'target-arrow-color': '#ccc',
              'target-arrow-shape': 'triangle'
            }
          },
          {
            selector: '.high-score',
            style: {
              'background-color': '#4caf50',
              'width': 80,
              'height': 80
            }
          },
          {
            selector: '.verified',
            style: {
              'border-width': 3,
              'border-color': '#4caf50'
            }
          }
        ],
        layout: {
          name: 'cose',
          animate: true,
          animationDuration: 500
        }
      });
    }

    // Update graph data
    const cy = cyRef.current;
    cy.elements().remove();

    if (skills && skills.length > 0) {
      // Add nodes for each skill
      const nodes = skills.map((skill, index) => ({
        data: {
          id: skill._id || `skill-${index}`,
          label: skill.name,
          score: skill.score || 0,
          verified: skill.verified || false
        },
        classes: skill.score > 50 ? 'high-score' : (skill.verified ? 'verified' : '')
      }));

      // Add edges for skill relationships
      const edges = [];
      for (let i = 0; i < skills.length; i++) {
        for (let j = i + 1; j < skills.length; j++) {
          const strength = Math.random() * 0.8 + 0.2; // Random strength between 0.2 and 1
          edges.push({
            data: {
              source: skills[i]._id || `skill-${i}`,
              target: skills[j]._id || `skill-${j}`,
              strength: strength
            },
            style: {
              'line-color': `rgba(74, 144, 226, ${strength})`,
              'target-arrow-color': `rgba(74, 144, 226, ${strength})`
            }
          });
        }
      }

      cy.add([...nodes, ...edges]);

      // Run layout
      cy.layout({
        name: 'cose',
        animate: true,
        animationDuration: 500,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 100,
        gravity: 0.3
      }).run();
    }

    // Cleanup
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [skills]);

  return (
    <div className="skill-graph-container">
      <div id="cy" style={{ width: '100%', height: '500px', border: '1px solid #ddd', borderRadius: '8px' }}></div>
      <div className="graph-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#4a90e2' }}></span>
          <span>Normal Skill</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#4caf50' }}></span>
          <span>High Score (>50)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#4a90e2', border: '3px solid #4caf50' }}></span>
          <span>Verified Skill</span>
        </div>
      </div>
    </div>
  );
};

export default SkillGraph;
