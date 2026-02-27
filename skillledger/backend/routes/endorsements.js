const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Endorsement = require('../models/Endorsement');
const Skill = require('../models/Skill');
const User = require('../models/User');
const { calculateSkillScore } = require('../utils/skillScore');

// Add endorsement to skill
router.post('/', auth, async (req, res) => {
  try {
    const { skillId, weight, comment } = req.body;

    // Check if skill exists
    const skill = await Skill.findById(skillId);
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    // Check if endorsing own skill (not allowed)
    if (skill.user.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot endorse your own skill' });
    }

    // Create endorsement
    const endorsement = new Endorsement({
      skill: skillId,
      endorser: req.user.id,
      weight: weight || 1,
      comment
    });

    await endorsement.save();

    // Add to skill
    await Skill.findByIdAndUpdate(skillId, {
      $push: {
        endorsements: {
          endorser: req.user.id,
          weight: weight || 1,
          timestamp: Date.now()
        }
      }
    });

    // Recalculate score
    await calculateSkillScore(skillId, skill.user);

    res.status(201).json(endorsement);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Already endorsed this skill' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Get endorsements for a skill
router.get('/skill/:skillId', auth, async (req, res) => {
  try {
    const endorsements = await Endorsement.find({ skill: req.params.skillId })
      .populate('endorser', 'name email')
      .sort({ timestamp: -1 });
    res.json(endorsements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get endorsements given by user
router.get('/given', auth, async (req, res) => {
  try {
    const endorsements = await Endorsement.find({ endorser: req.user.id })
      .populate('skill', 'name')
      .sort({ timestamp: -1 });
    res.json(endorsements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove endorsement
router.delete('/:id', auth, async (req, res) => {
  try {
    const endorsement = await Endorsement.findById(req.params.id);
    
    if (!endorsement) {
      return res.status(404).json({ message: 'Endorsement not found' });
    }

    // Only endorser can remove
    if (endorsement.endorser.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Remove from skill
    await Skill.findByIdAndUpdate(endorsement.skill, {
      $pull: { endorsements: { endorser: req.user.id } }
    });

    await endorsement.deleteOne();

    // Recalculate score
    await calculateSkillScore(endorsement.skill, endorsement.endorser);

    res.json({ message: 'Endorsement removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
