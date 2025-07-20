import { describe, it, expect } from 'vitest';
import { parseRecipient, type Recipient } from './recipient';

describe('parseRecipent', () => {
  it('should parse string recipient correctly', () => {
    const recipient: Recipient = 'test@example.com';
    const result = parseRecipient(recipient);

    expect(result).toEqual({
      email: 'test@example.com',
      fields: {},
    });
  });

  it('should parse object recipient with email only', () => {
    const recipient: Recipient = {
      email: 'test@example.com',
    };
    const result = parseRecipient(recipient);

    expect(result).toEqual({
      email: 'test@example.com',
      fields: {},
    });
  });

  it('should parse object recipient with email and fields', () => {
    const recipient: Recipient = {
      email: 'test@example.com',
      fields: {
        name: 'John Doe',
        company: 'Test Corp',
      },
    };
    const result = parseRecipient(recipient);

    expect(result).toEqual({
      email: 'test@example.com',
      fields: {
        name: 'John Doe',
        company: 'Test Corp',
      },
    });
  });

  it('should parse object recipient with undefined fields', () => {
    const recipient: Recipient = {
      email: 'test@example.com',
      fields: undefined,
    };
    const result = parseRecipient(recipient);

    expect(result).toEqual({
      email: 'test@example.com',
      fields: {},
    });
  });

  it('should parse object recipient with empty fields object', () => {
    const recipient: Recipient = {
      email: 'test@example.com',
      fields: {},
    };
    const result = parseRecipient(recipient);

    expect(result).toEqual({
      email: 'test@example.com',
      fields: {},
    });
  });

  it('should handle complex field values', () => {
    const recipient: Recipient = {
      email: 'test@example.com',
      fields: {
        name: 'John Doe',
        age: '30',
        isActive: 'true',
        preferences: '["email", "sms"]',
      },
    };
    const result = parseRecipient(recipient);

    expect(result).toEqual({
      email: 'test@example.com',
      fields: {
        name: 'John Doe',
        age: '30',
        isActive: 'true',
        preferences: '["email", "sms"]',
      },
    });
  });
});

describe('Recipient type', () => {
  it('should accept string recipient', () => {
    const recipient: Recipient = 'test@example.com';
    expect(typeof recipient).toBe('string');
  });

  it('should accept object recipient', () => {
    const recipient: Recipient = {
      email: 'test@example.com',
      fields: { name: 'John' },
    };
    expect(typeof recipient).toBe('object');
    expect(recipient.email).toBe('test@example.com');
  });

  it('should accept object recipient without fields', () => {
    const recipient: Recipient = {
      email: 'test@example.com',
    };
    expect(typeof recipient).toBe('object');
    expect(recipient.email).toBe('test@example.com');
  });
});
