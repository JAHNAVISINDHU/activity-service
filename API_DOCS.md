# API Documentation

## Base URL

```
http://localhost:3000
```

---

## Authentication

No authentication required. All endpoints are public but **rate-limited**.

---

## Rate Limiting

| Property        | Value                      |
|----------------|----------------------------|
| Window         | 60 seconds (1 minute)      |
| Max Requests   | 50 per unique IP           |
| Status on limit| `429 Too Many Requests`    |
| Header         | `Retry-After: <seconds>`   |

---

## Endpoints

### POST /api/v1/activities

Accepts a user activity event, validates it, and asynchronously queues it for processing.

#### Request

| Property      | Value                    |
|--------------|--------------------------|
| Method       | `POST`                   |
| Path         | `/api/v1/activities`     |
| Content-Type | `application/json`       |

#### Request Body Schema

| Field       | Type          | Required | Description                                         |
|-------------|---------------|----------|-----------------------------------------------------|
| `userId`    | `string`      | ✅ Yes   | Unique identifier for the user (e.g., UUID)         |
| `eventType` | `string`      | ✅ Yes   | Non-empty string describing the event               |
| `timestamp` | `string`      | ✅ Yes   | Valid ISO-8601 datetime string                      |
| `payload`   | `object`      | ✅ Yes   | Arbitrary JSON object with event-specific metadata  |

#### Example Request

```http
POST /api/v1/activities HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "page_view",
  "timestamp": "2024-03-15T10:30:00.000Z",
  "payload": {
    "page": "/products",
    "sessionId": "sess-abc-123",
    "device": "mobile"
  }
}
```

#### Responses

---

**202 Accepted** — Event successfully validated and queued

```json
{
  "message": "Activity event accepted and queued for processing",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "eventType": "page_view",
    "timestamp": "2024-03-15T10:30:00.000Z",
    "payload": {
      "page": "/products",
      "sessionId": "sess-abc-123",
      "device": "mobile"
    }
  }
}
```

---

**400 Bad Request** — Validation failed

```json
{
  "error": "Validation failed",
  "details": [
    "\"userId\" is required",
    "\"timestamp\" must be a valid ISO-8601 date string"
  ]
}
```

Possible validation errors:
- `"userId" is required` — field missing
- `"userId" must not be empty` — empty string
- `"eventType" is required`
- `"eventType" must not be empty`
- `"timestamp" is required`
- `"timestamp" must be a valid ISO-8601 date string`
- `"payload" is required`
- `"payload" must be a JSON object`

---

**429 Too Many Requests** — Rate limit exceeded

Headers:
```
Retry-After: 60
RateLimit-Limit: 50
RateLimit-Remaining: 0
RateLimit-Reset: <epoch>
```

Body:
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Maximum 50 requests per minute allowed.",
  "retryAfter": 60
}
```

---

**500 Internal Server Error** — Server-side failure (e.g., RabbitMQ unavailable)

```json
{
  "error": "Internal Server Error"
}
```

---

### GET /health

Health check endpoint.

#### Example Request

```http
GET /health HTTP/1.1
Host: localhost:3000
```

#### Response — 200 OK

```json
{
  "status": "ok",
  "timestamp": "2024-03-15T10:30:00.000Z"
}
```

---

## Database Schema

Activities are stored in MongoDB with the following structure:

| Field         | Type       | Description                                      |
|--------------|------------|--------------------------------------------------|
| `_id`        | ObjectId   | MongoDB auto-generated document ID               |
| `id`         | string     | Virtual field — hex string of `_id`              |
| `userId`     | string     | User identifier from the event                   |
| `eventType`  | string     | Type of event                                    |
| `timestamp`  | Date       | Original event timestamp (from ISO-8601 string)  |
| `processedAt`| Date       | Timestamp when the consumer processed the event  |
| `payload`    | Mixed      | Arbitrary JSON object                            |

---

## Example Use Cases

### E-commerce: Track a Purchase

```json
{
  "userId": "user-abc-001",
  "eventType": "purchase_completed",
  "timestamp": "2024-03-15T14:22:00.000Z",
  "payload": {
    "orderId": "order-98765",
    "amount": 149.99,
    "currency": "USD",
    "items": ["sku-001", "sku-002"]
  }
}
```

### SaaS: Track Feature Usage

```json
{
  "userId": "user-xyz-999",
  "eventType": "feature_used",
  "timestamp": "2024-03-15T09:15:30.000Z",
  "payload": {
    "feature": "export_csv",
    "plan": "pro",
    "duration_ms": 1200
  }
}
```

### Fintech: Track Login

```json
{
  "userId": "user-fin-555",
  "eventType": "user_login",
  "timestamp": "2024-03-15T07:00:00.000Z",
  "payload": {
    "ip": "203.0.113.42",
    "mfa": true,
    "device": "desktop"
  }
}
```
