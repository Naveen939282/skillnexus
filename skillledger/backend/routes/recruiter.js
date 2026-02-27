const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Score = require('../models/Score');

// Apply auth and role middleware to all routes
router.use(auth);
router.use(role(['recruiter', 'admin']));

// Search users by skill combinations
router.get('/search', async (req, res) => {
  try {
    const { skills, minScore, maxScore, page = 1, limit = 10 } = req.query;

    let query = { role: 'student' };

    // Filter by skills
    if (skills) {
      const skillArray = skills.split(',').map(s => s.trim());
      query['skills.name'] = { $in: skillArray };
    }

    // Filter by credibility score
    if (minScore || maxScore) {
      query.credibilityScore = {};
      if (minScore) query.credibilityScore.$gte = parseInt(minScore);
      if (maxScore) query.credibilityScore.$lte = parseInt(maxScore);
    }

    const users = await User.find(query)
      .select('-password')
      .populate('skills')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get candidate profile with skill graph
router.get('/candidate/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate({
        path: 'skills',
        populate: {
          path: 'relatedSkills.skill'
        }
      });

    if (!user || user.role !== 'student') {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Get score history
    const scores = await Score.find({ user: req.params.id })
      .populate('skill', 'name')
      .sort({ timestamp: -1 })
      .limit(20);

    res.json({
      user,
      scores,
      skillGraph: {
        nodes: user.skills.map(s => ({
          id: s._id,
          label: s.name,
          data: { proficiency: s.proficiencyLevel, score: s.score }
        })),
        edges: user.skills.flatMap(s => 
          s.relatedSkills.map(r => ({
            source: s._id,
            target: r.skill._id,
            strength: r.strength
          }))
        )
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate and download skill report
router.get('/report/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('skills');

    if (!user || user.role !== 'student') {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Generate report data
    const report = {
      candidate: {
        name: user.name,
        email: user.email,
        bio: user.bio,
        credibilityScore: user.credibilityScore,
        profileImage: user.profileImage
      },
      skills: user.skills.map(s => ({
        name: s.name,
        proficiency: s.proficiencyLevel,
        score: s.score,
        category: s.category,
        endorsements: s.endorsements.length,
        challengesPassed: s.challenges.filter(c => c.passed).length,
        verified: s.verified,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      })),
      generatedAt: new Date().toISOString(),
      reportId: `RPT-${Date.now()}`
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get recruiter dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalSkills = await Skill.countDocuments();
    const avgScore = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: null, avg: { $avg: '$credibilityScore' } } }
    ]);

    res.json({
      totalStudents,
      totalSkills,
      averageCredibilityScore: avgScore[0]?.avg || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
