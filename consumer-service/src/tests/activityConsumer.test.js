const { parseMessage, processMessage } = require('../consumers/activityConsumer');

describe('parseMessage', () => {
  const validActivity = {
    userId: 'user-789',
    eventType: 'checkout',
    timestamp: '2024-02-20T14:00:00.000Z',
    payload: { cartId: 'cart-001', total: 99.99 },
  };

  function makeBuffer(data) {
    return Buffer.from(JSON.stringify(data));
  }

  test('should parse a valid message', () => {
    const result = parseMessage(makeBuffer(validActivity));
    expect(result).toMatchObject(validActivity);
  });

  test('should throw on invalid JSON', () => {
    expect(() => parseMessage(Buffer.from('not-json'))).toThrow(/Failed to parse message JSON/);
  });

  test('should throw when userId is missing', () => {
    const { userId, ...data } = validActivity;
    expect(() => parseMessage(makeBuffer(data))).toThrow(/Missing required field: "userId"/);
  });

  test('should throw when eventType is missing', () => {
    const { eventType, ...data } = validActivity;
    expect(() => parseMessage(makeBuffer(data))).toThrow(/Missing required field: "eventType"/);
  });

  test('should throw when timestamp is missing', () => {
    const { timestamp, ...data } = validActivity;
    expect(() => parseMessage(makeBuffer(data))).toThrow(/Missing required field: "timestamp"/);
  });

  test('should throw when payload is missing', () => {
    const { payload, ...data } = validActivity;
    expect(() => parseMessage(makeBuffer(data))).toThrow(/Missing required field: "payload"/);
  });

  test('should throw when timestamp is invalid date', () => {
    expect(() =>
      parseMessage(makeBuffer({ ...validActivity, timestamp: 'bad-date' }))
    ).toThrow(/"timestamp" is not a valid date/);
  });

  test('should throw when payload is an array', () => {
    expect(() =>
      parseMessage(makeBuffer({ ...validActivity, payload: [1, 2, 3] }))
    ).toThrow(/"payload" must be a JSON object/);
  });

  test('should throw when userId is empty string', () => {
    expect(() =>
      parseMessage(makeBuffer({ ...validActivity, userId: '' }))
    ).toThrow(/"userId" must be a non-empty string/);
  });

  test('should throw when eventType is empty string', () => {
    expect(() =>
      parseMessage(makeBuffer({ ...validActivity, eventType: '' }))
    ).toThrow(/"eventType" must be a non-empty string/);
  });
});

describe('processMessage', () => {
  const validActivity = {
    userId: 'user-789',
    eventType: 'checkout',
    timestamp: '2024-02-20T14:00:00.000Z',
    payload: { cartId: 'cart-001' },
  };

  let mockChannel;

  beforeEach(() => {
    mockChannel = {
      ack: jest.fn(),
      nack: jest.fn(),
    };
    jest.resetModules();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should ACK message after successful save', async () => {
    const db = require('../db/mongo');
    jest.spyOn(db, 'saveActivity').mockResolvedValueOnce({ _id: 'mongo-id-1' });

    const { processMessage: pm } = require('../consumers/activityConsumer');
    const msg = { content: Buffer.from(JSON.stringify(validActivity)) };

    await pm(msg, mockChannel);

    expect(db.saveActivity).toHaveBeenCalledWith(validActivity);
    expect(mockChannel.ack).toHaveBeenCalledWith(msg);
    expect(mockChannel.nack).not.toHaveBeenCalled();
  });

  test('should NACK without requeue on parse error', async () => {
    const { processMessage: pm } = require('../consumers/activityConsumer');
    const msg = { content: Buffer.from('invalid-json') };

    await pm(msg, mockChannel);

    expect(mockChannel.nack).toHaveBeenCalledWith(msg, false, false);
    expect(mockChannel.ack).not.toHaveBeenCalled();
  });

  test('should NACK with requeue on DB error', async () => {
    const db = require('../db/mongo');
    jest.spyOn(db, 'saveActivity').mockRejectedValueOnce(new Error('DB timeout'));

    const { processMessage: pm } = require('../consumers/activityConsumer');
    const msg = { content: Buffer.from(JSON.stringify(validActivity)) };

    await pm(msg, mockChannel);

    expect(mockChannel.nack).toHaveBeenCalledWith(msg, false, true);
    expect(mockChannel.ack).not.toHaveBeenCalled();
  });

  test('should do nothing if msg is null', async () => {
    const { processMessage: pm } = require('../consumers/activityConsumer');
    await pm(null, mockChannel);
    expect(mockChannel.ack).not.toHaveBeenCalled();
    expect(mockChannel.nack).not.toHaveBeenCalled();
  });
});
