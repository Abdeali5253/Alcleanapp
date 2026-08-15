import { describe, expect, it } from 'vitest';
import { notificationHistoryForUser } from './routes/notifications.js';

describe('notification history ownership', () => {
  it('returns only the authenticated customer records and strips device tokens', () => {
    const entries = [
      {
        id: 'one', userId: 'customer-a', token: 'device-a',
        title: 'A', body: 'private-a', data: {}, timestamp: '2026-01-01T00:00:00Z',
        delivered: true, read: false,
      },
      {
        id: 'two', userId: 'customer-b', token: 'device-b',
        title: 'B', body: 'private-b', data: {}, timestamp: '2026-01-02T00:00:00Z',
        delivered: true, read: false,
      },
    ];
    const result = notificationHistoryForUser(entries, 'customer-a');
    expect(result).toHaveLength(1);
    expect(result[0].body).toBe('private-a');
    expect(result[0]).not.toHaveProperty('token');
  });
});
