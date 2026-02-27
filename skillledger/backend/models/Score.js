const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  totalScore: {
    type: Number,
    default: 0
  },
  history: [{
    score: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      enum: ['skill_added', 'endorsement', 'challenge_passed', 'peer_review'],
      required: true
    }
  }],
  breakdown: {
    proficiencyScore: {
      type: Number,
      default: 0
    },
    endorsementScore: {
      type: Number,
      default: 0
    },
    challengeScore: {
      type: Number,
      default: 0
    },
    peerReviewScore: {
      type: Number,
      default: 0
    }
  },
  calculatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
scoreSchema.index({ user: 1, skill: 1 }, { unique: true });

module.exports = mongoose.model('Score', scoreSchema);
