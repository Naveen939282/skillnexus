const mongoose = require('mongoose');

const endorsementSchema = new mongoose.Schema({
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  endorser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weight: {
    type: Number,
    min: 0,
    max: 1,
    default: 1
  },
  comment: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate endorsements
endorsementSchema.index({ skill: 1, endorser: 1 }, { unique: true });

module.exports = mongoose.model('Endorsement', endorsementSchema);
