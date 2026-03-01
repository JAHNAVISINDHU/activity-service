![Tests](https://img.shields.io/badge/tests-43%20passing-brightgreen) ![Node](https://img.shields.io/badge/node-v24-blue) ![Docker](https://img.shields.io/badge/docker-compose-blue)

# Event-Driven User Activity Service

A production-ready microservice system for tracking user activities using an event-driven architecture with RabbitMQ, Express.js, and MongoDB — fully containerized with Docker Compose.

---

## Architecture Overview

```
Client → [API Service :3000] → [RabbitMQ Queue: user_activities] → [Consumer Service] → [MongoDB]
```

| Component        | Role                                                         |
|-----------------|--------------------------------------------------------------|
| **API Service**  | REST API — validates requests, publishes events to RabbitMQ |
| **Consumer**     | Worker — consumes queue messages, persists to MongoDB        |
| **RabbitMQ**     | Message broker — decouples ingestion from processing         |
| **MongoDB**      | Persistent store for all activity events                     |

### Key Architecture Decisions

- **202 Accepted** response pattern: the API confirms only that the event was *queued*, not *processed*, ensuring low latency under load.
- **Durable queue + persistent messages**: messages survive RabbitMQ restarts.
- **prefetch(1)**: consumer processes one message at a time, preventing memory overload.
- **ACK/NACK strategy**: malformed messages are dead-lettered (no requeue); transient DB errors requeue for retry.
- **IP-based rate limiting**: enforced at the API layer — 50 req/min per IP with `Retry-After` header.
- **Environment-variable config**: all secrets and URLs are injected via `.env` — no hardcoded credentials.

---

## Prerequisites

- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) v2+
- (Optional for local dev) Node.js 20+

---

## Quick Start

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd activity-service

# 2. Copy environment file
cp .env.example .env

# 3. Start all services
docker-compose up --build

# Services will be available at:
# API:          http://localhost:3000
# RabbitMQ UI:  http://localhost:15672  (admin / admin123)
```

That's it — one command spins up the API, consumer, RabbitMQ, and MongoDB.

---

## Environment Variables

All configuration is via `.env` (see `.env.example`):

| Variable               | Default        | Description                            |
|------------------------|----------------|----------------------------------------|
| `PORT`                 | `3000`         | API service port                       |
| `RABBITMQ_USER`        | `admin`        | RabbitMQ username                      |
| `RABBITMQ_PASS`        | `admin123`     | RabbitMQ password                      |
| `RABBITMQ_QUEUE`       | `user_activities` | Queue name                          |
| `MONGO_USER`           | `root`         | MongoDB username                       |
| `MONGO_PASS`           | `root123`      | MongoDB password                       |
| `MONGO_DB`             | `activity_db`  | MongoDB database name                  |
| `RATE_LIMIT_WINDOW_MS` | `60000`        | Rate limit window in ms (1 min)        |
| `RATE_LIMIT_MAX`       | `50`           | Max requests per window per IP         |

---

## Running Tests

Tests run inside each service directory (no Docker required if Node.js is installed locally).

### API Service Tests

```bash
cd api-service
npm install
npm test
# or with coverage:
npm run test:coverage
```

### Consumer Service Tests

```bash
cd consumer-service
npm install
npm test
# or with coverage:
npm run test:coverage
```

### What's Tested

**API Service:**
- `activityValidator.test.js` — All Joi validation rules (valid/invalid fields, ISO-8601 dates, object types)
- `rabbitmqPublisher.test.js` — Publisher channel calls, serialization, error paths
- `activities.route.test.js` — Full route integration: 202, 400, 500 responses

**Consumer Service:**
- `activityConsumer.test.js` — Message parsing, ACK/NACK behavior, DB error handling
- `mongo.test.js` — saveActivity model construction and error propagation

---

## API Usage

### Submit an Activity Event

```bash
curl -X POST http://localhost:3000/api/v1/activities \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "eventType": "page_view",
    "timestamp": "2024-03-15T10:30:00.000Z",
    "payload": {
      "page": "/dashboard",
      "referrer": "https://google.com"
    }
  }'
```

**Success Response (202):**
```json
{
  "message": "Activity event accepted and queued for processing",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "eventType": "page_view",
    "timestamp": "2024-03-15T10:30:00.000Z",
    "payload": { "page": "/dashboard" }
  }
}
```

**Validation Error (400):**
```json
{
  "error": "Validation failed",
  "details": ["\"timestamp\" must be a valid ISO-8601 date string"]
}
```

**Rate Limited (429):**
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Maximum 50 requests per minute allowed.",
  "retryAfter": 60
}
```
Headers: `Retry-After: 60`

### Health Check

```bash
curl http://localhost:3000/health
```

---

## Project Structure

```
activity-service/
├── docker-compose.yml
├── .env
├── .env.example
├── README.md
├── API_DOCS.md
├── api-service/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app.js                    # Express app entry
│       ├── routes/
│       │   └── activities.js         # POST /api/v1/activities
│       ├── middleware/
│       │   ├── rateLimiter.js        # IP rate limiting
│       │   └── errorHandler.js       # Global error handler
│       ├── validators/
│       │   └── activityValidator.js  # Joi schema validation
│       ├── publishers/
│       │   └── rabbitmq.js           # RabbitMQ connection & publish
│       └── tests/
│           ├── activityValidator.test.js
│           ├── rabbitmqPublisher.test.js
│           └── activities.route.test.js
└── consumer-service/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── consumer.js               # Main entry: connects MQ + DB
        ├── consumers/
        │   └── activityConsumer.js   # Parse + process + ACK logic
        ├── db/
        │   └── mongo.js              # Mongoose model + saveActivity
        └── tests/
            ├── activityConsumer.test.js
            └── mongo.test.js
```

---

## Monitoring

- **RabbitMQ Management UI**: http://localhost:15672 (admin/admin123)
  - Monitor queue depth, message rates, consumer status
- **MongoDB**: connect via `mongodb://root:root123@localhost:27017/activity_db?authSource=admin`

---

## Stopping the Services

```bash
docker-compose down          # Stop containers
docker-compose down -v       # Stop and remove volumes (clears MongoDB data)
```

