const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Skill = require('../models/Skill');
const User = require('../models/User');
const Score = require('../models/Score');
const { calculateSkillScore } = require('../utils/skillScore');

// Add new skill
router.post('/', auth, async (req, res) => {
  try {
    const { name, proficiencyLevel, category, relatedSkills } = req.body;

    const skill = new Skill({
      name,
      user: req.user.id,
      proficiencyLevel: proficiencyLevel || 1,
      category,
      relatedSkills: relatedSkills || []
    });

    await skill.save();

    // Add skill to user
    await User.findByIdAndUpdate(req.user.id, {
      $push: { skills: skill._id }
    });

    // Create initial score
    const score = await calculateSkillScore(skill._id, req.user.id);
    
    res.status(201).json(skill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's all skills
router.get('/', auth, async (req, res) => {
  try {
    const skills = await Skill.find({ user: req.user.id })
      .populate('relatedSkills.skill')
      .sort({ createdAt: -1 });
    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get skill by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
      .populate('relatedSkills.skill')
      .populate('challenges.challenge');
    
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }
    res.json(skill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update skill
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, proficiencyLevel, category } = req.body;
    
    const skill = await Skill.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { name, proficiencyLevel, category },
      { new: true }
    );

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    // Recalculate score
    await calculateSkillScore(skill._id, req.user.id);

    res.json(skill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete skill
router.delete('/:id', auth, async (req, res) => {
  try {
    const skill = await Skill.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    // Remove from user
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { skills: req.params.id }
    });

    // Delete associated score
    await Score.findOneAndDelete({ skill: req.params.id, user: req.user.id });

    res.json({ message: 'Skill deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add related skill
router.post('/:id/related', auth, async (req, res) => {
  try {
    const { relatedSkillId, strength } = req.body;

    const skill = await Skill.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { 
        $push: { 
          relatedSkills: { 
            skill: relatedSkillId, 
            strength: strength || 0.5 
          } 
        } 
      },
      { new: true }
    );

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    res.json(skill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get skill graph for current user
router.get('/graph/data', auth, async (req, res) => {
  try {
    const skills = await Skill.find({ user: req.user.id });
    
    const nodes = skills.map(skill => ({
      id: skill._id.toString(),
      label: skill.name,
      data: {
        proficiency: skill.proficiencyLevel,
        score: skill.score,
        category: skill.category
      }
    }));

    const edges = [];
    skills.forEach(skill => {
      skill.relatedSkills.forEach(rel => {
        edges.push({
          data: {
            source: skill._id.toString(),
            target: rel.skill.toString(),
            strength: rel.strength
          }
        });
      });
    });

    res.json({ nodes, edges });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
