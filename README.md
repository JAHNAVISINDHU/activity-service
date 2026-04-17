# Event-Driven User Activity Service

A production-ready microservice system for tracking user activities using an event-driven architecture with RabbitMQ, Express.js, and MongoDB — fully containerized with Docker Compose.

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/JAHNAVISINDHU/activity-service)
![Tests](https://img.shields.io/badge/tests-43%20passing-brightgreen) 
![Node](https://img.shields.io/badge/node-v20+-blue) 
![Docker](https://img.shields.io/badge/docker-compose-blue)

---

## Architecture Overview

The system uses an asynchronous pattern to ensure high availability and low latency.

```text
Client → [API Service :3000] → [RabbitMQ Queue: user_activities] → [Consumer Service] → [MongoDB]
````

| Component | Role |
| :--- | :--- |
| **API Service** | REST API — validates requests, publishes events to RabbitMQ |
| **Consumer** | Worker — consumes queue messages, persists to MongoDB |
| **RabbitMQ** | Message broker — decouples ingestion from processing |
| **MongoDB** | Persistent store for all activity events |

### Key Architecture Decisions

  - **202 Accepted Response**: The API confirms receipt immediately after queuing, ensuring minimal latency.
  - **Reliability**: Durable queues and persistent messages ensure data survives RabbitMQ restarts.
  - **Backpressure Management**: `prefetch(1)` ensures the consumer processes one message at a time, preventing memory spikes.
  - **Error Handling**: Malformed messages are dead-lettered, while transient DB errors trigger a requeue.
  - **Security**: IP-based rate limiting (50 req/min) prevents API abuse.

-----

## 🚀 Quick Start

### Prerequisites

  - [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) v2+
  - (Optional) Node.js 20+ for local testing

### Installation & Execution

```bash
# 1. Clone the repo
git clone [https://github.com/JAHNAVISINDHU/activity-service.git](https://github.com/JAHNAVISINDHU/activity-service.git)
cd activity-service

# 2. Setup environment
cp .env.example .env

# 3. Start the stack
docker-compose up --build
```

**Access Points:**

  - **API**: `http://localhost:3000`
  - **RabbitMQ Management**: `http://localhost:15672` (Login: `admin` / `admin123`)
  - **Health Check**: `http://localhost:3000/health`

-----

## 🧪 Running Tests

Tests are segregated by service and can be run locally or via container.

### API Service

```bash
cd api-service
npm install
npm test
```

### Consumer Service

```bash
cd consumer-service
npm install
npm test
```

-----

## 🔗 API Usage

### Submit an Activity Event

`POST /api/v1/activities`

**Request Body:**

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "page_view",
  "timestamp": "2024-03-15T10:30:00.000Z",
  "payload": {
    "page": "/dashboard",
    "referrer": "[https://google.com](https://google.com)"
  }
}
```

**Responses:**

  - `202 Accepted`: Event queued successfully.
  - `400 Bad Request`: Validation failed (e.g., invalid timestamp format).
  - `429 Too Many Requests`: Rate limit exceeded.

-----

## 📂 Project Structure

```text
activity-service/
├── api-service/
│   ├── src/
│   │   ├── routes/          # Express routes
│   │   ├── middleware/      # Rate limiter & Error handling
│   │   ├── validators/      # Joi schemas
│   │   └── publishers/      # RabbitMQ logic
├── consumer-service/
│   ├── src/
│   │   ├── consumers/       # MQ Message handlers
│   │   └── db/              # Mongoose models
├── docker-compose.yml       # Infrastructure orchestration
└── .env                     # Configuration
```

**Developed by [Jahnavi Sindhu](https://www.google.com/search?q=https://github.com/JAHNAVISINDHU)**
