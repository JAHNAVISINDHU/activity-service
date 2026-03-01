const express = require('express');
const morgan = require('morgan');
const activityRoutes = require('./routes/activities');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const { connectRabbitMQ } = require('./publishers/rabbitmq');

const app = express();

app.use(express.json());
app.use(morgan('combined'));
app.use(rateLimiter);
app.use('/api/v1/activities', activityRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectRabbitMQ();
    app.listen(PORT, () => {
      console.log('API Service running on port ' + PORT);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
