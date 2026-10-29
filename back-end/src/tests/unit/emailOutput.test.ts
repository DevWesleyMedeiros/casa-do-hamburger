import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resendEmailService } from '../../services/email/resendEmail.service.js';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('resend', () => ({
  Resend: class {
    emails = { send };
  },
}));

beforeEach(() => {
  send.mockReset().mockResolvedValue({ error: null });
});

describe('HTML do e-mail de redefinição', () => {
  it('mantém nome malicioso como texto e escapa o atributo do link', async () => {
    await resendEmailService.sendPasswordResetEmail({
      to: 'unit@example.invalid',
      name: '<img src=x onerror="attack()">',
      resetUrl: 'https://frontend.example/reset-password?token=opaque&other="value"',
    });
    const html = send.mock.calls[0]![0].html as string;
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img src=x onerror=&quot;attack()&quot;&gt;');
    expect(html).toContain('token=opaque&amp;other=&quot;value&quot;');
  });
});
