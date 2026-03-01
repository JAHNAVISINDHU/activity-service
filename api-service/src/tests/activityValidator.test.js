const { validateActivity } = require('../validators/activityValidator');

describe('Activity Validator', () => {
  const validActivity = {
    userId: 'user-123',
    eventType: 'page_view',
    timestamp: '2024-01-15T10:30:00.000Z',
    payload: { page: '/home', duration: 30 },
  };

  test('should pass validation for a valid activity', () => {
    const { error, value } = validateActivity(validActivity);
    expect(error).toBeUndefined();
    expect(value).toMatchObject(validActivity);
  });

  test('should fail when userId is missing', () => {
    const { error } = validateActivity({ ...validActivity, userId: undefined });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/"userId" is required/);
  });

  test('should fail when userId is empty string', () => {
    const { error } = validateActivity({ ...validActivity, userId: '' });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/"userId"/);
  });

  test('should fail when eventType is missing', () => {
    const { error } = validateActivity({ ...validActivity, eventType: undefined });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/"eventType" is required/);
  });

  test('should fail when eventType is empty string', () => {
    const { error } = validateActivity({ ...validActivity, eventType: '' });
    expect(error).toBeDefined();
  });

  test('should fail when timestamp is missing', () => {
    const { error } = validateActivity({ ...validActivity, timestamp: undefined });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/"timestamp" is required/);
  });

  test('should fail when timestamp is not valid ISO-8601', () => {
    const { error } = validateActivity({ ...validActivity, timestamp: 'not-a-date' });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/ISO-8601/);
  });

  test('should fail when payload is missing', () => {
    const { error } = validateActivity({ ...validActivity, payload: undefined });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/"payload" is required/);
  });

  test('should fail when payload is not an object', () => {
    const { error } = validateActivity({ ...validActivity, payload: 'string' });
    expect(error).toBeDefined();
  });

  test('should fail when payload is an array', () => {
    const { error } = validateActivity({ ...validActivity, payload: [1, 2, 3] });
    expect(error).toBeDefined();
  });

  test('should return all validation errors when multiple fields are invalid', () => {
    const { error } = validateActivity({});
    expect(error).toBeDefined();
    expect(error.details.length).toBeGreaterThan(1);
  });

  test('should accept any valid ISO-8601 timestamp format', () => {
    const timestamps = [
      '2024-01-15T10:30:00Z',
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00+05:30',
    ];
    timestamps.forEach((timestamp) => {
      const { error } = validateActivity({ ...validActivity, timestamp });
      expect(error).toBeUndefined();
    });
  });
});
