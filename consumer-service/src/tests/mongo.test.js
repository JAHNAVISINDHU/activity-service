// var declarations are hoisted and initialized before jest.mock factory is invoked
var mockSave = jest.fn();
var MockActivity = jest.fn().mockImplementation(() => ({ save: mockSave }));

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue(),
    // model() is called at mongo.js load time — return MockActivity constructor
    model: jest.fn(() => MockActivity),
    Schema: actual.Schema,
  };
});

// Require ONCE after mock is set — Activity inside mongo.js becomes MockActivity
const { saveActivity } = require('../db/mongo');

describe('saveActivity', () => {
  beforeEach(() => {
    MockActivity.mockClear();
    mockSave.mockReset();
  });

  const validActivityData = {
    userId: 'user-save-test',
    eventType: 'purchase',
    timestamp: '2024-05-10T08:00:00.000Z',
    payload: { orderId: 'order-999' },
  };

  test('should call save on a new Activity document', async () => {
    mockSave.mockResolvedValueOnce({ _id: 'new-mongo-id' });

    await saveActivity(validActivityData);

    expect(MockActivity).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  test('should resolve with the saved document', async () => {
    const savedDoc = { _id: 'doc-id-42', userId: 'user-save-test' };
    mockSave.mockResolvedValueOnce(savedDoc);

    const result = await saveActivity(validActivityData);

    expect(result).toEqual(savedDoc);
  });

  test('should propagate DB save errors', async () => {
    mockSave.mockRejectedValueOnce(new Error('Write conflict'));

    await expect(saveActivity(validActivityData)).rejects.toThrow('Write conflict');
  });
});
