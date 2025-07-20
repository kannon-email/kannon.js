import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KannonCli, type KannonConfig, type KannonSender, type SendOptions } from '../kannon';
import type { Recipient } from '../recipient';

// Mock all external dependencies
vi.mock('@grpc/grpc-js', () => ({
  credentials: {
    createInsecure: vi.fn(() => ({})),
    createSsl: vi.fn(() => ({})),
  },
  Metadata: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
  })),
}));

const mockSendHtml = vi.fn();
const mockSendTemplate = vi.fn();

vi.mock('../proto/kannon/mailer/apiv1/mailerapiv1', () => ({
  MailerClient: vi.fn().mockImplementation(() => ({
    sendHtml: mockSendHtml,
    sendTemplate: mockSendTemplate,
  })),
}));

vi.mock('../utils/grpc-promisify', () => ({
  promisifyAll: vi.fn((client) => client),
}));

describe('KannonCli Integration Tests', () => {
  let kannonCli: KannonCli;
  let config: KannonConfig;
  let sender: KannonSender;

  beforeEach(() => {
    vi.clearAllMocks();

    config = {
      endpoint: 'api.kannon.email:443',
    };

    sender = {
      email: 'noreply@example.com',
      alias: 'Example Company',
    };

    kannonCli = new KannonCli('example.com', 'test-api-key', sender, config);
  });

  describe('Complete Email Sending Flow', () => {
    it('should send a complete HTML email with all features', async () => {
      const recipients: Recipient[] = [
        { email: 'user1@example.com', fields: { name: 'John Doe', company: 'ACME Corp' } },
        { email: 'user2@example.com', fields: { name: 'Jane Smith', company: 'Tech Inc' } },
        'user3@example.com',
      ];

      const subject = 'Welcome to Our Service!';
      const html = `
        <html>
          <body>
            <h1>Welcome {{name}}!</h1>
            <p>Thank you for joining {{company}}.</p>
            <p>We're excited to have you on board.</p>
          </body>
        </html>
      `;

      const scheduledTime = new Date('2024-01-15T10:00:00Z');
      const options: SendOptions = {
        scheduledTime,
        globalFields: {
          supportEmail: 'support@example.com',
          website: 'https://example.com',
        },
        attachments: [
          {
            filename: 'welcome-guide.pdf',
            content: Buffer.from('PDF content here'),
          },
          {
            filename: 'terms.pdf',
            content: Buffer.from('Terms and conditions'),
          },
        ],
      };

      mockSendHtml.mockResolvedValue({
        success: true,
        messageId: 'msg_123456789',
        recipientsCount: 3,
      });

      const result = await kannonCli.sendHtml(recipients, subject, html, options);

      expect(mockSendHtml).toHaveBeenCalledWith(
        {
          html,
          sender,
          subject,
          recipients: [
            { email: 'user1@example.com', fields: { name: 'John Doe', company: 'ACME Corp' } },
            { email: 'user2@example.com', fields: { name: 'Jane Smith', company: 'Tech Inc' } },
            { email: 'user3@example.com', fields: {} },
          ],
          scheduledTime,
          attachments: options.attachments,
          globalFields: options.globalFields,
        },
        expect.any(Object), // metadata with authorization
      );

      expect(result).toEqual({
        success: true,
        messageId: 'msg_123456789',
        recipientsCount: 3,
      });
    });

    it('should send a template email with personalization', async () => {
      const recipients: Recipient[] = [
        { email: 'customer1@example.com', fields: { firstName: 'Alice', lastName: 'Johnson' } },
        { email: 'customer2@example.com', fields: { firstName: 'Bob', lastName: 'Wilson' } },
      ];

      const subject = 'Your Order Confirmation';
      const templateId = 'order-confirmation-template';

      const options: SendOptions = {
        globalFields: {
          orderNumber: 'ORD-2024-001',
          totalAmount: '$99.99',
          shippingAddress: '123 Main St, City, State 12345',
        },
      };

      mockSendTemplate.mockResolvedValue({
        success: true,
        messageId: 'msg_987654321',
        recipientsCount: 2,
      });

      const result = await kannonCli.sendTemplate(recipients, subject, templateId, options);

      expect(mockSendTemplate).toHaveBeenCalledWith(
        {
          templateId,
          sender,
          subject,
          recipients: [
            { email: 'customer1@example.com', fields: { firstName: 'Alice', lastName: 'Johnson' } },
            { email: 'customer2@example.com', fields: { firstName: 'Bob', lastName: 'Wilson' } },
          ],
          scheduledTime: expect.any(Date),
          attachments: [],
          globalFields: options.globalFields,
        },
        expect.any(Object),
      );

      expect(result).toEqual({
        success: true,
        messageId: 'msg_987654321',
        recipientsCount: 2,
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle authentication errors', async () => {
      const recipients: Recipient[] = [{ email: 'test@example.com' }];
      const subject = 'Test Subject';
      const html = '<p>Test content</p>';

      const authError = new Error('Authentication failed: Invalid API key');
      mockSendHtml.mockRejectedValue(authError);

      await expect(kannonCli.sendHtml(recipients, subject, html)).rejects.toThrow(
        'Authentication failed: Invalid API key',
      );
    });

    it('should handle network errors', async () => {
      const recipients: Recipient[] = [{ email: 'test@example.com' }];
      const subject = 'Test Subject';
      const templateId = 'test-template';

      const networkError = new Error('Network error: Connection timeout');
      mockSendTemplate.mockRejectedValue(networkError);

      await expect(kannonCli.sendTemplate(recipients, subject, templateId)).rejects.toThrow(
        'Network error: Connection timeout',
      );
    });

    it('should handle invalid recipient data', async () => {
      const recipients: Recipient[] = [
        { email: 'valid@example.com' },
        { email: 'invalid-email' }, // Invalid email format
      ];
      const subject = 'Test Subject';
      const html = '<p>Test content</p>';

      const validationError = new Error('Invalid email format: invalid-email');
      mockSendHtml.mockRejectedValue(validationError);

      await expect(kannonCli.sendHtml(recipients, subject, html)).rejects.toThrow(
        'Invalid email format: invalid-email',
      );
    });
  });

  describe('Configuration Scenarios', () => {
    it('should work with insecure connection for development', () => {
      const devConfig: KannonConfig = {
        endpoint: 'localhost:9090',
      };

      const devSender: KannonSender = {
        email: 'dev@localhost',
        alias: 'Development',
      };

      const devClient = new KannonCli('localhost', 'dev-key', devSender, devConfig);

      expect(devClient).toBeInstanceOf(KannonCli);
    });

    it('should work with secure connection for production', () => {
      const prodConfig: KannonConfig = {
        endpoint: 'api.kannon.email:443',
      };

      const prodSender: KannonSender = {
        email: 'noreply@company.com',
        alias: 'Company Name',
      };

      const prodClient = new KannonCli('company.com', 'prod-api-key', prodSender, prodConfig);

      expect(prodClient).toBeInstanceOf(KannonCli);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty recipients array', async () => {
      const recipients: Recipient[] = [];
      const subject = 'Test Subject';
      const html = '<p>Test content</p>';

      mockSendHtml.mockResolvedValue({
        success: true,
        messageId: 'msg_empty',
        recipientsCount: 0,
      });

      const result = await kannonCli.sendHtml(recipients, subject, html);

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

      expect(result).toBeDefined();
    });

    it('should handle large attachment files', async () => {
      const recipients: Recipient[] = [{ email: 'test@example.com' }];
      const subject = 'Large Attachment Test';
      const html = '<p>Test with large attachment</p>';

      const largeAttachment = {
        filename: 'large-file.pdf',
        content: Buffer.alloc(1024 * 1024), // 1MB buffer
      };

      const options: SendOptions = {
        attachments: [largeAttachment],
      };

      mockSendHtml.mockResolvedValue({
        success: true,
        messageId: 'msg_large_attachment',
        recipientsCount: 1,
      });

      const result = await kannonCli.sendHtml(recipients, subject, html, options);

      expect(mockSendHtml).toHaveBeenCalledWith(
        {
          html,
          sender,
          subject,
          recipients: [{ email: 'test@example.com', fields: {} }],
          scheduledTime: expect.any(Date),
          attachments: [largeAttachment],
          globalFields: {},
        },
        expect.any(Object),
      );

      expect(result).toBeDefined();
    });

    it('should handle special characters in fields', async () => {
      const recipients: Recipient[] = [
        {
          email: 'test@example.com',
          fields: {
            name: 'José María',
            company: 'Café & Co.',
            message: 'Hello "world" with \'quotes\' and <tags>',
          },
        },
      ];

      const subject = 'Special Characters Test';
      const html = '<p>Hello {{name}} from {{company}}</p>';

      mockSendHtml.mockResolvedValue({
        success: true,
        messageId: 'msg_special_chars',
        recipientsCount: 1,
      });

      const result = await kannonCli.sendHtml(recipients, subject, html);

      expect(mockSendHtml).toHaveBeenCalledWith(
        {
          html,
          sender,
          subject,
          recipients: [
            {
              email: 'test@example.com',
              fields: {
                name: 'José María',
                company: 'Café & Co.',
                message: 'Hello "world" with \'quotes\' and <tags>',
              },
            },
          ],
          scheduledTime: expect.any(Date),
          attachments: [],
          globalFields: {},
        },
        expect.any(Object),
      );

      expect(result).toBeDefined();
    });
  });
});
