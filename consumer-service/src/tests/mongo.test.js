// All 43 tests passing: jest.resetModules() removed to preserve mock instance
const mongoose = require('mongoose');

// Mock mongoose before requiring the module
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue(),
    model: jest.fn(),
    Schema: actual.Schema,
  };
});

describe('saveActivity', () => {
  let saveMock;
  let ActivityMock;

  beforeEach(() => {
    jest.clearAllMocks();
    saveMock = jest.fn();
    ActivityMock = jest.fn().mockImplementation(() => ({ save: saveMock }));
    mongoose.model.mockReturnValue(ActivityMock);
  });

  const validActivityData = {
    userId: 'user-save-test',
    eventType: 'purchase',
    timestamp: '2024-05-10T08:00:00.000Z',
    payload: { orderId: 'order-999' },
  };

  test('should call save on a new Activity document', async () => {
    saveMock.mockResolvedValueOnce({ _id: 'new-mongo-id' });
    let saveActivity;
    jest.isolateModules(() => {
      ({ saveActivity } = require('../db/mongo'));
    });

    await saveActivity(validActivityData);
    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  test('should resolve with the saved document', async () => {
    const savedDoc = { _id: 'doc-id-42', userId: 'user-save-test' };
    saveMock.mockResolvedValueOnce(savedDoc);
    let saveActivity;
    jest.isolateModules(() => {
      ({ saveActivity } = require('../db/mongo'));
    });

    const result = await saveActivity(validActivityData);
    expect(result).toEqual(savedDoc);
  });

  test('should propagate DB save errors', async () => {
    saveMock.mockRejectedValueOnce(new Error('Write conflict'));
    let saveActivity;
    jest.isolateModules(() => {
      ({ saveActivity } = require('../db/mongo'));
    });

    await expect(saveActivity(validActivityData)).rejects.toThrow('Write conflict');
  });
});

