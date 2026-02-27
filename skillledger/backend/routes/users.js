const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Score = require('../models/Score');

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('skills');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, bio, profileImage } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, bio, profileImage },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID (public profile)
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate({
        path: 'skills',
        populate: { path: 'relatedSkills.skill' }
      });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user skill graph data
router.get('/:id/skill-graph', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('skills');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build graph data
    const nodes = user.skills.map(skill => ({
      id: skill._id.toString(),
      label: skill.name,
      proficiency: skill.proficiencyLevel,
      score: skill.score,
      category: skill.category
    }));

    const edges = [];
    user.skills.forEach(skill => {
      skill.relatedSkills.forEach(rel => {
        edges.push({
          source: skill._id.toString(),
          target: rel.skill.toString(),
          strength: rel.strength
        });
      });
    });

    res.json({ nodes, edges });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user credibility score
router.get('/:id/credibility', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate credibility from skills
    const skills = await Skill.find({ user: req.params.id });
    const scores = await Score.find({ user: req.params.id });

    const totalScore = scores.reduce((sum, s) => sum + s.totalScore, 0);
    const avgScore = scores.length > 0 ? totalScore / scores.length : 0;

    res.json({
      userId: user._id,
      credibilityScore: user.credibilityScore || Math.round(avgScore),
      skillCount: skills.length,
      scores: scores
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
