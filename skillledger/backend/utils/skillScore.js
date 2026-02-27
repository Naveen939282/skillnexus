const Skill = require('../models/Skill');
const Score = require('../models/Score');
const User = require('../models/User');

/**
 * Skill Scoring Algorithm
 * 
 * Score = (Proficiency Score * 0.4) + (Endorsement Score * 0.35) + (Challenge Score * 0.25)
 * 
 * Where:
 * - Proficiency Score = (proficiencyLevel / 5) * 100 * 0.4
 * - Endorsement Score = min(endorsements.length * 10, 100) * 0.35
 * - Challenge Score = (challengesPassed / totalChallenges) * 100 * 0.25
 * 
 * Additional factors:
 * - Recency bonus: skills updated recently get a slight boost
 * - Verification bonus: verified skills get +10%
 */
const calculateSkillScore = async (skillId, userId) => {
  try {
    const skill = await Skill.findById(skillId);
    if (!skill) {
      throw new Error('Skill not found');
    }

    // 1. Proficiency Score (40%)
    const proficiencyScore = (skill.proficiencyLevel / 5) * 100 * 0.4;

    // 2. Endorsement Score (35%)
    const endorsementCount = skill.endorsements.length;
    const endorsementScore = Math.min(endorsementCount * 10, 100) * 0.35;

    // Calculate weighted endorsement score
    let weightedEndorsementScore = 0;
    if (skill.endorsements.length > 0) {
      const totalWeight = skill.endorsements.reduce((sum, e) => sum + e.weight, 0);
      const avgWeight = totalWeight / skill.endorsements.length;
      weightedEndorsementScore = Math.min(avgWeight * 10, 100) * 0.35;
    }

    // 3. Challenge Score (25%)
    const passedChallenges = skill.challenges.filter(c => c.passed).length;
    const totalChallenges = skill.challenges.length;
    const challengeScore = totalChallenges > 0 
      ? (passedChallenges / totalChallenges) * 100 * 0.25 
      : 0;

    // Calculate base score
    let totalScore = proficiencyScore + weightedEndorsementScore + challengeScore;

    // Recency bonus (5% if updated in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (skill.updatedAt > sevenDaysAgo) {
      totalScore *= 1.05;
    }

    // Verification bonus (10%)
    if (skill.verified) {
      totalScore *= 1.10;
    }

    // Cap at 100
    totalScore = Math.min(totalScore, 100);

    // Update skill score
    skill.score = Math.round(totalScore);
    await skill.save();

    // Save score history
    const scoreRecord = new Score({
      user: skill.user,
      skill: skill._id,
      score: Math.round(totalScore),
      breakdown: {
        proficiency: Math.round(proficiencyScore),
        endorsement: Math.round(weightedEndorsementScore),
        challenge: Math.round(challengeScore),
        recencyBonus: skill.updatedAt > sevenDaysAgo ? 5 : 0,
        verificationBonus: skill.verified ? 10 : 0
      }
    });
    await scoreRecord.save();

    // Update user's credibility score
    await updateUserCredibilityScore(skill.user);

    return Math.round(totalScore);
  } catch (error) {
    console.error('Error calculating skill score:', error);
    throw error;
  }
};

/**
 * Update user's overall credibility score
 * Credibility = average of all skill scores
 */
const updateUserCredibilityScore = async (userId) => {
  try {
    const skills = await Skill.find({ user: userId });
    
    if (skills.length === 0) {
      await User.findByIdAndUpdate(userId, { credibilityScore: 0 });
      return 0;
    }

    const avgScore = skills.reduce((sum, s) => sum + s.score, 0) / skills.length;
    await User.findByIdAndUpdate(userId, { credibilityScore: Math.round(avgScore) });
    
    return Math.round(avgScore);
  } catch (error) {
    console.error('Error updating user credibility score:', error);
    throw error;
  }
};

/**
 * Get score history for a user
 */
const getScoreHistory = async (userId, skillId = null) => {
  try {
    const query = { user: userId };
    if (skillId) {
      query.skill = skillId;
    }

    const scores = await Score.find(query)
      .populate('skill', 'name')
      .sort({ timestamp: -1 })
      .limit(50);

    return scores;
  } catch (error) {
    console.error('Error getting score history:', error);
    throw error;
  }
};

/**
 * Calculate skill evolution over time
 */
const getSkillEvolution = async (userId, skillId) => {
  try {
    const scores = await Score.find({ user: userId, skill: skillId })
      .sort({ timestamp: 1 })
      .limit(30);

    const evolution = scores.map(s => ({
      date: s.timestamp,
      score: s.score,
      breakdown: s.breakdown
    }));

    return evolution;
  } catch (error) {
    console.error('Error getting skill evolution:', error);
    throw error;
  }
};

module.exports = {
  calculateSkillScore,
  updateUserCredibilityScore,
  getScoreHistory,
  getSkillEvolution
};
