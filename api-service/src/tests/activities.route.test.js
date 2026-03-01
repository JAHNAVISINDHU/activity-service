const request = require('supertest');
const app = require('../app');
const rabbitmq = require('../publishers/rabbitmq');

// Mock RabbitMQ so no real connection needed
jest.mock('../publishers/rabbitmq', () => ({
  connectRabbitMQ: jest.fn().mockResolvedValue(),
  publishActivity: jest.fn().mockResolvedValue(),
  getChannel: jest.fn(),
  setChannel: jest.fn(),
  closeRabbitMQ: jest.fn(),
}));

describe('POST /api/v1/activities', () => {
  const validBody = {
    userId: 'uuid-abc-123',
    eventType: 'login',
    timestamp: '2024-03-01T09:00:00.000Z',
    payload: { ip: '192.168.1.1' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 202 for a valid activity', async () => {
    const res = await request(app).post('/api/v1/activities').send(validBody);
    expect(res.status).toBe(202);
    expect(res.body.message).toMatch(/accepted/i);
    expect(rabbitmq.publishActivity).toHaveBeenCalledTimes(1);
  });

  test('should return 400 when userId is missing', async () => {
    const { userId, ...body } = validBody;
    const res = await request(app).post('/api/v1/activities').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  test('should return 400 when eventType is missing', async () => {
    const { eventType, ...body } = validBody;
    const res = await request(app).post('/api/v1/activities').send(body);
    expect(res.status).toBe(400);
  });

  test('should return 400 when timestamp is invalid', async () => {
    const res = await request(app)
      .post('/api/v1/activities')
      .send({ ...validBody, timestamp: 'not-a-date' });
    expect(res.status).toBe(400);
    expect(res.body.details[0]).toMatch(/ISO-8601/);
  });

  test('should return 400 when payload is not an object', async () => {
    const res = await request(app)
      .post('/api/v1/activities')
      .send({ ...validBody, payload: 'bad-payload' });
    expect(res.status).toBe(400);
  });

  test('should return 400 for empty request body', async () => {
    const res = await request(app).post('/api/v1/activities').send({});
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(1);
  });

  test('should return 500 if publishActivity throws', async () => {
    rabbitmq.publishActivity.mockRejectedValueOnce(new Error('Queue failure'));
    const res = await request(app).post('/api/v1/activities').send(validBody);
    expect(res.status).toBe(500);
  });

  test('GET /health should return 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
