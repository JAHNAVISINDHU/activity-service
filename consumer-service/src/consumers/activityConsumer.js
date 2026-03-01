const { saveActivity } = require('../db/mongo');

function parseMessage(msgContent) {
  let activity;
  try { activity = JSON.parse(msgContent.toString()); }
  catch (err) { throw new Error('Failed to parse message JSON: ' + err.message); }
  const requiredFields = ['userId', 'eventType', 'timestamp', 'payload'];
  for (const field of requiredFields) {
    if (activity[field] === undefined || activity[field] === null)
      throw new Error('Missing required field: "' + field + '"');
  }
  if (typeof activity.userId    !== 'string' || !activity.userId.trim())    throw new Error('"userId" must be a non-empty string');
  if (typeof activity.eventType !== 'string' || !activity.eventType.trim()) throw new Error('"eventType" must be a non-empty string');
  const parsedDate = new Date(activity.timestamp);
  if (isNaN(parsedDate.getTime())) throw new Error('"timestamp" is not a valid date');
  if (typeof activity.payload !== 'object' || Array.isArray(activity.payload)) throw new Error('"payload" must be a JSON object');
  return activity;
}

async function processMessage(msg, channel) {
  if (!msg) return;
  let activity;
  try { activity = parseMessage(msg.content); }
  catch (err) { console.error('[Consumer] Message parse error: ' + err.message); channel.nack(msg, false, false); return; }
  try {
    const saved = await saveActivity(activity);
    console.log('[Consumer] Stored activity: ' + saved._id + ' for user ' + activity.userId);
    channel.ack(msg);
  } catch (err) { console.error('[Consumer] DB save error: ' + err.message); channel.nack(msg, false, true); }
}

module.exports = { parseMessage, processMessage };
