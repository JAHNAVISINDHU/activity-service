const express = require('express');
const router = express.Router();
const { validateActivity } = require('../validators/activityValidator');
const { publishActivity } = require('../publishers/rabbitmq');

/**
 * POST /api/v1/activities
 * Accepts an activity event, validates it, and publishes to RabbitMQ
 */
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = validateActivity(req.body);

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((d) => d.message),
      });
    }

    await publishActivity(value);

    return res.status(202).json({
      message: 'Activity event accepted and queued for processing',
      data: value,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
