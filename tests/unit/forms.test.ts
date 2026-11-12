import { describe, expect, it, vi } from 'vitest';
import { applyServerError, resolveMessage } from '@/hooks/use-app-form';
import { AppError } from '@/lib/errors';
import { getMessages } from '@/lib/messages';
import { CodeFormSchema, PhoneFormSchema } from '@/features/auth/types';

const t = getMessages('en');

describe('login checks: only cheap and certain ones (Document 5, section 10; D6-25)', () => {
  it('a missing phone, and a wrong shape, give catalogue keys', () => {
    expect(PhoneFormSchema.safeParse({ phone: '' }).error?.issues[0]?.message).toBe('validation.phoneRequired');
    expect(PhoneFormSchema.safeParse({ phone: '12345' }).error?.issues[0]?.message).toBe('validation.phoneShape');
  });
  it('accepts the common ways of writing an Indian mobile (Document 2, section 3), the shapes the backend reads', () => {
    for (const phone of ['9876543210', '09876543210', '919876543210', '+919876543210', '+91 98765-43210', '98765 43210']) {
      expect(PhoneFormSchema.safeParse({ phone }).success, phone).toBe(true);
    }
    expect(PhoneFormSchema.safeParse({ phone: '+449876543210' }).success).toBe(false);
  });
  it('accepts ten digits, with or without +91 and spaces, and sends them without spaces', () => {
    expect(PhoneFormSchema.parse({ phone: '98765 43210' }).phone).toBe('9876543210');
    expect(PhoneFormSchema.parse({ phone: '+91 98765 43210' }).phone).toBe('+919876543210');
  });
  it('does not copy the backend rule about which numbers are mobiles (that is PHONE_INVALID)', () => {
    expect(PhoneFormSchema.safeParse({ phone: '5111111111' }).success).toBe(true);
  });
  it('the code: required, six digits', () => {
    expect(CodeFormSchema.safeParse({ code: '' }).error?.issues[0]?.message).toBe('validation.codeRequired');
    expect(CodeFormSchema.safeParse({ code: '12ab' }).error?.issues[0]?.message).toBe('validation.codeShape');
    expect(CodeFormSchema.parse({ code: '123 456' }).code).toBe('123456');
  });
  it('keys turn into text in each language; other text is shown as it is', () => {
    expect(resolveMessage('validation.phoneRequired', t)).toBe('Enter your mobile number.');
    expect(resolveMessage('validation.phoneRequired', getMessages('hi'))).toBe('अपना मोबाइल नंबर लिखें।');
    expect(resolveMessage('Already text', t)).toBe('Already text');
  });
});

describe('backend errors land where Document 5, section 10 says', () => {
  const fakeForm = (values: Record<string, string>) => {
    const setError = vi.fn();
    return { form: { getValues: () => values, setError } as never, setError };
  };

  it('a field error goes under its field', () => {
    const { form, setError } = fakeForm({ email: '' });
    applyServerError(form, new AppError({ code: 'VALIDATION_FAILED', status: 400, fields: [{ field: 'email', messages: ['x'] }] }), t);
    expect(setError).toHaveBeenCalledWith('email', { type: 'server', message: t.errors.codes.VALIDATION_FAILED });
  });

  it('a field the screen does not have goes to the summary with its name, and is never dropped', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { form, setError } = fakeForm({ email: '' });
    applyServerError(form, new AppError({ code: 'VALIDATION_FAILED', status: 400, fields: [{ field: 'renamedField', messages: ['x'] }] }), t);
    expect(setError).toHaveBeenCalledWith('root.field_renamedField', { type: 'server', message: 'renamedField: please check this and try again.' });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('a code that belongs to a field goes under it, with our message', () => {
    const { form, setError } = fakeForm({ code: '' });
    applyServerError(form, new AppError({ code: 'OTP_INVALID', status: 400 }), t, { codes: { OTP_INVALID: 'code' } });
    expect(setError).toHaveBeenCalledWith('code', { type: 'server', message: t.errors.codes.OTP_INVALID });
  });

  it('anything else goes to the summary only', () => {
    const { form, setError } = fakeForm({ code: '' });
    applyServerError(form, new AppError({ code: 'SMS_UNAVAILABLE', status: 503 }), t);
    expect(setError).toHaveBeenCalledWith('root.server', { type: 'server', message: t.errors.codes.SMS_UNAVAILABLE });
  });
});
