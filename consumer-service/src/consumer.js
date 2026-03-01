const amqplib = require('amqplib');
const { connectMongoDB } = require('./db/mongo');
const { processMessage } = require('./consumers/activityConsumer');

const QUEUE_NAME = process.env.RABBITMQ_QUEUE || 'user_activities';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';

async function connectRabbitMQ(retries = 15, delay = 4000) {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await amqplib.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();
      await channel.assertQueue(QUEUE_NAME, { durable: true });

      // Process one message at a time
      channel.prefetch(1);

      console.log(`[Consumer] Connected to RabbitMQ. Listening on queue: ${QUEUE_NAME}`);

      channel.consume(QUEUE_NAME, (msg) => processMessage(msg, channel));

      connection.on('error', (err) => {
        console.error('[Consumer] RabbitMQ connection error:', err.message);
        setTimeout(main, 5000);
      });

      connection.on('close', () => {
        console.warn('[Consumer] RabbitMQ connection closed. Reconnecting...');
        setTimeout(main, 5000);
      });

      return;
    } catch (err) {
      console.warn(`[Consumer] RabbitMQ not ready, retrying (${i + 1}/${retries})...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error('[Consumer] Failed to connect to RabbitMQ.');
}

async function main() {
  try {
    await connectMongoDB();
    await connectRabbitMQ();
  } catch (err) {
    console.error('[Consumer] Fatal error:', err.message);
    process.exit(1);
  }
}

main();
