const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Challenge = require('../models/Challenge');
const Skill = require('../models/Skill');
const { calculateSkillScore } = require('../utils/skillScore');

// Get all challenges (for a skill)
router.get('/skill/:skillId', auth, async (req, res) => {
  try {
    const challenges = await Challenge.find({ skill: req.params.skillId })
      .sort({ createdAt: -1 });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get challenge by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('skill', 'name user');
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit challenge solution
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const { submissionUrl, description } = req.body;

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Check if already submitted
    const existingSubmission = challenge.submissions.find(
      sub => sub.user.toString() === req.user.id
    );
    if (existingSubmission) {
      return res.status(400).json({ message: 'Already submitted' });
    }

    // Add submission
    challenge.submissions.push({
      user: req.user.id,
      submissionUrl,
      description,
      status: 'pending',
      timestamp: Date.now()
    });

    await challenge.save();

    res.status(201).json({ message: 'Submission added', submissions: challenge.submissions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Evaluate submission (skill owner or admin)
router.put('/:id/evaluate', auth, async (req, res) => {
  try {
    const { submissionId, status } = req.body;

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const submission = challenge.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Update submission status
    submission.status = status;
    submission.evaluatedAt = Date.now();
    await challenge.save();

    // Update skill if approved
    if (status === 'approved') {
      const skill = await Skill.findById(challenge.skill);
      if (skill) {
        // Add to skill challenges if not already
        const alreadyPassed = skill.challenges.some(
          c => c.challenge.toString() === challenge._id.toString()
        );
        
        if (!alreadyPassed) {
          skill.challenges.push({
            challenge: challenge._id,
            passed: true,
            timestamp: Date.now()
          });
          await skill.save();

          // Recalculate score
          await calculateSkillScore(skill._id, skill.user);
        }
      }
    }

    res.json({ message: 'Submission evaluated', submission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's submissions
router.get('/submissions/mine', auth, async (req, res) => {
  try {
    const challenges = await Challenge.find({
      'submissions.user': req.user.id
    });

    const submissions = challenges.map(ch => ({
      challenge: {
        _id: ch._id,
        title: ch.title,
        skill: ch.skill,
        points: ch.points
      },
      submission: ch.submissions.find(s => s.user.toString() === req.user.id)
    }));

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
