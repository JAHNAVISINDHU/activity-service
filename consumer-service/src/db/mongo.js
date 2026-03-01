const mongoose = require('mongoose');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://root:root123@localhost:27017/activity_db?authSource=admin';

const activitySchema = new mongoose.Schema(
  {
    userId:      { type: String, required: true, index: true },
    eventType:   { type: String, required: true, index: true },
    timestamp:   { type: Date,   required: true },
    processedAt: { type: Date,   default: () => new Date() },
    payload:     { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { versionKey: false, timestamps: false }
);

activitySchema.virtual('id').get(function () { return this._id.toHexString(); });
activitySchema.set('toJSON', { virtuals: true });

const Activity = mongoose.model('Activity', activitySchema);

async function connectMongoDB(retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try { await mongoose.connect(MONGO_URL); console.log('Connected to MongoDB'); return; }
    catch { console.warn('MongoDB not ready, retrying (' + (i+1) + '/' + retries + ')...'); await new Promise(r => setTimeout(r, delay)); }
  }
  throw new Error('Failed to connect to MongoDB after multiple retries.');
}

async function saveActivity(activityData) {
  const activity = new Activity({
    userId:      activityData.userId,
    eventType:   activityData.eventType,
    timestamp:   new Date(activityData.timestamp),
    processedAt: new Date(),
    payload:     activityData.payload,
  });
  return activity.save();
}

module.exports = { connectMongoDB, saveActivity, Activity };
