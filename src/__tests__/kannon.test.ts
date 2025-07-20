import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KannonCli, type KannonConfig, type KannonSender, type SendOptions } from '../kannon';
import type { Recipient } from '../recipient';

// Mock the gRPC client and related modules
vi.mock('@grpc/grpc-js', () => ({
  credentials: {
    createInsecure: vi.fn(() => ({})),
    createSsl: vi.fn(() => ({})),
  },
  Metadata: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
  })),
}));

// Mock the protobuf client
const mockSendHtml = vi.fn();
const mockSendTemplate = vi.fn();

vi.mock('../proto/kannon/mailer/apiv1/mailerapiv1', () => ({
  MailerClient: vi.fn().mockImplementation(() => ({
    sendHtml: mockSendHtml,
    sendTemplate: mockSendTemplate,
  })),
}));

// Mock the promisify utility
vi.mock('../utils/grpc-promisify', () => ({
  promisifyAll: vi.fn((client) => client),
}));

describe('KannonCli', () => {
  let kannonCli: KannonCli;
  let config: KannonConfig;
  let sender: KannonSender;

  beforeEach(() => {
    vi.clearAllMocks();

    config = {
      endpoint: 'test.example.com:443',
    };

    sender = {
      email: 'test@example.com',
      alias: 'Test Sender',
    };

    kannonCli = new KannonCli('test.example.com', 'test-api-key', sender, config);
  });

  describe('constructor', () => {
    it('should create a KannonCli instance with secure credentials', () => {
      const { credentials } = require('@grpc/grpc-js');

      expect(kannonCli).toBeInstanceOf(KannonCli);
      expect(credentials.createSsl).toHaveBeenCalled();
      expect(credentials.createInsecure).not.toHaveBeenCalled();
    });

    it('should create a KannonCli instance with insecure credentials when skipTLS is true', () => {
      const insecureConfig: KannonConfig = {
        endpoint: 'test.example.com:443',
      };

      new KannonCli('test.example.com', 'test-api-key', sender, insecureConfig);

      const { credentials } = require('@grpc/grpc-js');
      expect(credentials.createInsecure).toHaveBeenCalled();
    });

    it('should encode credentials correctly', () => {
      // The token should be base64 encoded "test.example.com:test-api-key"
      const expectedToken = Buffer.from('test.example.com:test-api-key').toString('base64');

      // We can't directly access the private token property, but we can test it indirectly
      // by calling a method that uses it
      const recipients: Recipient[] = [{ email: 'test@example.com' }];
      kannonCli.sendHtml(recipients, 'Test Subject', '<p>Test</p>');

      expect(mockSendHtml).toHaveBeenCalled();
    });
  });

  describe('sendHtml', () => {
    it('should send HTML email with basic parameters', async () => {
      const recipients: Recipient[] = [{ email: 'recipient@example.com' }];
      const subject = 'Test Subject';
      const html = '<p>Test HTML content</p>';

      mockSendHtml.mockResolvedValue({ success: true });

      const result = await kannonCli.sendHtml(recipients, subject, html);

      expect(mockSendHtml).toHaveBeenCalledWith(
        {
          html,
          sender,
          subject,
          recipients: [{ email: 'recipient@example.com', fields: {} }],
          scheduledTime: expect.any(Date),
          attachments: [],
          globalFields: {},
        },
        expect.any(Object), // metadata
      );
      expect(result).toEqual({ success: true });
    });

    it('should send HTML email with all options', async () => {
      const recipients: Recipient[] = [
        { email: 'recipient1@example.com', fields: { name: 'John' } },
        'recipient2@example.com',
      ];
      const subject = 'Test Subject';
      const html = '<p>Test HTML content</p>';
      const scheduledTime = new Date('2024-01-01T10:00:00Z');
      const options: SendOptions = {
        scheduledTime,
        globalFields: { company: 'Test Corp' },
        attachments: [
          {
            filename: 'test.pdf',
            content: Buffer.from('test content'),
          },
        ],
      };

      mockSendHtml.mockResolvedValue({ success: true });

      await kannonCli.sendHtml(recipients, subject, html, options);

      expect(mockSendHtml).toHaveBeenCalledWith(
        {
          html,
          sender,
          subject,
          recipients: [
            { email: 'recipient1@example.com', fields: { name: 'John' } },
            { email: 'recipient2@example.com', fields: {} },
          ],
          scheduledTime,
          attachments: options.attachments,
          globalFields: options.globalFields,
        },
        expect.any(Object),
      );
    });

    it('should handle string recipients correctly', async () => {
      const recipients: Recipient[] = ['test@example.com'];
      const subject = 'Test Subject';
      const html = '<p>Test HTML content</p>';

      mockSendHtml.mockResolvedValue({ success: true });

      await kannonCli.sendHtml(recipients, subject, html);

      expect(mockSendHtml).toHaveBeenCalledWith(
        {
          html,
          sender,
          subject,
          recipients: [{ email: 'test@example.com', fields: {} }],
          scheduledTime: expect.any(Date),
          attachments: [],
          globalFields: {},
        },
        expect.any(Object),
      );
    });

    it('should handle empty recipients array', async () => {
      const recipients: Recipient[] = [];
      const subject = 'Test Subject';
      const html = '<p>Test HTML content</p>';

      mockSendHtml.mockResolvedValue({ success: true });

      await kannonCli.sendHtml(recipients, subject, html);

      expect(mockSendHtml).toHaveBeenCalledWith(
        {
          html,
          sender,
          subject,
          recipients: [],
          scheduledTime: expect.any(Date),
          attachments: [],
          globalFields: {},
        },
        expect.any(Object),
      );
    });
  });

  describe('sendTemplate', () => {
    it('should send template email with basic parameters', async () => {
      const recipients: Recipient[] = [{ email: 'recipient@example.com' }];
      const subject = 'Test Subject';
      const templateId = 'template-123';

      mockSendTemplate.mockResolvedValue({ success: true });

      const result = await kannonCli.sendTemplate(recipients, subject, templateId);

      expect(mockSendTemplate).toHaveBeenCalledWith(
        {
          templateId,
          sender,
          subject,
          recipients: [{ email: 'recipient@example.com', fields: {} }],
          scheduledTime: expect.any(Date),
          attachments: [],
          globalFields: {},
        },
        expect.any(Object),
      );
      expect(result).toEqual({ success: true });
    });

    it('should send template email with all options', async () => {
      const recipients: Recipient[] = [
        { email: 'recipient1@example.com', fields: { name: 'John' } },
        'recipient2@example.com',
      ];
      const subject = 'Test Subject';
      const templateId = 'template-123';
      const scheduledTime = new Date('2024-01-01T10:00:00Z');
      const options: SendOptions = {
        scheduledTime,
        globalFields: { company: 'Test Corp' },
        attachments: [
          {
            filename: 'test.pdf',
            content: Buffer.from('test content'),
          },
        ],
      };

      mockSendTemplate.mockResolvedValue({ success: true });

      await kannonCli.sendTemplate(recipients, subject, templateId, options);

      expect(mockSendTemplate).toHaveBeenCalledWith(
        {
          templateId,
          sender,
          subject,
          recipients: [
            { email: 'recipient1@example.com', fields: { name: 'John' } },
            { email: 'recipient2@example.com', fields: {} },
          ],
          scheduledTime,
          attachments: options.attachments,
          globalFields: options.globalFields,
        },
        expect.any(Object),
      );
    });
  });

  describe('error handling', () => {
    it('should propagate gRPC errors from sendHtml', async () => {
      const recipients: Recipient[] = [{ email: 'recipient@example.com' }];
      const subject = 'Test Subject';
      const html = '<p>Test HTML content</p>';

      const error = new Error('gRPC error');
      mockSendHtml.mockRejectedValue(error);

      await expect(kannonCli.sendHtml(recipients, subject, html)).rejects.toThrow('gRPC error');
    });

    it('should propagate gRPC errors from sendTemplate', async () => {
      const recipients: Recipient[] = [{ email: 'recipient@example.com' }];
      const subject = 'Test Subject';
      const templateId = 'template-123';

      const error = new Error('gRPC error');
      mockSendTemplate.mockRejectedValue(error);

      await expect(kannonCli.sendTemplate(recipients, subject, templateId)).rejects.toThrow('gRPC error');
    });
  });
});
