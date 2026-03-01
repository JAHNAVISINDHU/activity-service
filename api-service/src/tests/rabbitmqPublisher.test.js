const { publishActivity, setChannel } = require('../publishers/rabbitmq');

describe('RabbitMQ Publisher', () => {
  let mockChannel;

  beforeEach(() => {
    mockChannel = {
      sendToQueue: jest.fn().mockReturnValue(true),
      assertQueue: jest.fn().mockResolvedValue({}),
    };
    setChannel(mockChannel);
  });

  afterEach(() => {
    setChannel(null);
    jest.clearAllMocks();
  });

  const validActivity = {
    userId: 'user-456',
    eventType: 'button_click',
    timestamp: '2024-01-15T11:00:00.000Z',
    payload: { buttonId: 'cta-signup' },
  };

  test('should call sendToQueue with correct queue name', async () => {
    await publishActivity(validActivity);
    expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Buffer),
      expect.objectContaining({ persistent: true })
    );
  });

  test('should serialize activity as JSON in the message buffer', async () => {
    await publishActivity(validActivity);
    const callArgs = mockChannel.sendToQueue.mock.calls[0];
    const buffer = callArgs[1];
    const parsed = JSON.parse(buffer.toString());
    expect(parsed).toMatchObject(validActivity);
  });

  test('should send with persistent flag true', async () => {
    await publishActivity(validActivity);
    const options = mockChannel.sendToQueue.mock.calls[0][2];
    expect(options.persistent).toBe(true);
  });

  test('should throw error if channel is not available', async () => {
    setChannel(null);
    await expect(publishActivity(validActivity)).rejects.toThrow(
      'RabbitMQ channel not available'
    );
  });

  test('should throw error if sendToQueue returns false', async () => {
    mockChannel.sendToQueue.mockReturnValue(false);
    await expect(publishActivity(validActivity)).rejects.toThrow(
      'Failed to publish message to RabbitMQ queue'
    );
  });

  test('should set contentType to application/json', async () => {
    await publishActivity(validActivity);
    const options = mockChannel.sendToQueue.mock.calls[0][2];
    expect(options.contentType).toBe('application/json');
  });
});
