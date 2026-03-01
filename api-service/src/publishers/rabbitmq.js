const amqplib = require('amqplib');

const QUEUE_NAME = process.env.RABBITMQ_QUEUE || 'user_activities';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';

let connection = null;
let channel = null;

async function connectRabbitMQ(retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      connection = await amqplib.connect(RABBITMQ_URL);
      channel = await connection.createChannel();
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      console.log('Connected to RabbitMQ. Queue: ' + QUEUE_NAME);
      connection.on('error', (err) => { console.error('RabbitMQ connection error:', err.message); channel = null; connection = null; });
      connection.on('close', () => { console.warn('RabbitMQ connection closed.'); channel = null; connection = null; });
      return;
    } catch (err) {
      console.warn('RabbitMQ not ready, retrying (' + (i+1) + '/' + retries + ')...');
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error('Failed to connect to RabbitMQ after multiple retries.');
}

async function publishActivity(activity) {
  if (!channel) throw new Error('RabbitMQ channel not available');
  const message = JSON.stringify(activity);
  const sent = channel.sendToQueue(QUEUE_NAME, Buffer.from(message), { persistent: true, contentType: 'application/json' });
  if (!sent) throw new Error('Failed to publish message to RabbitMQ queue');
  console.log('Published activity event for user: ' + activity.userId);
}

function getChannel() { return channel; }
function setChannel(mockChannel) { channel = mockChannel; }

async function closeRabbitMQ() {
  try { if (channel) await channel.close(); if (connection) await connection.close(); } catch {}
}

module.exports = { connectRabbitMQ, publishActivity, getChannel, setChannel, closeRabbitMQ };
