import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithOtp = vi.fn();
vi.mock('../config/supabase.js', () => ({ createAuthClient: () => ({ auth: { signInWithOtp } }) }));
vi.mock('../repositories/profiles.repository.js', () => ({ getProfile: vi.fn(), isUsernameTaken: vi.fn() }));

const repo = await import('../repositories/profiles.repository.js');
const { signup, login, resend } = await import('./auth.controller.js');

function fakeRes() {
  const res = { statusCode: 200, body: undefined };
  res.status = (code) => ((res.statusCode = code), res);
  res.json = (data) => ((res.body = data), res);
  return res;
}

async function call(handler, body) {
  const res = fakeRes();
  const next = vi.fn();
  await handler({ body }, res, next);
  expect(next).not.toHaveBeenCalled();
  return res;
}

const noAccount = { status: 422, code: 'otp_disabled', message: 'Signups not allowed for otp' };

beforeEach(() => {
  vi.resetAllMocks();
  repo.isUsernameTaken.mockResolvedValue(false);
  signInWithOtp.mockResolvedValue({ error: null });
});

describe('login and resend do not reveal whether an account exists', () => {
  it.each([
    ['login', login],
    ['resend', resend],
  ])('%s answers 200 for an unknown email', async (_, handler) => {
    signInWithOtp.mockResolvedValue({ error: noAccount });
    const res = await call(handler, { email: 'nobody@northeastern.edu' });
    expect(res.statusCode).toBe(200);
  });

  it('login answers the same for a known email', async () => {
    const res = await call(login, { email: 'sam@northeastern.edu' });
    expect(res.statusCode).toBe(200);
    expect(signInWithOtp).toHaveBeenCalledWith({ email: 'sam@northeastern.edu', options: { shouldCreateUser: false } });
  });

  it('still reports a real send failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    signInWithOtp.mockResolvedValue({ error: { status: 500, message: 'smtp down' } });
    const res = await call(login, { email: 'sam@northeastern.edu' });
    expect(res.statusCode).toBe(502);
  });
});

describe('signup', () => {
  it('sends a code without checking whether the email has an account', async () => {
    const res = await call(signup, { username: 'sam', email: 'sam@northeastern.edu' });
    expect(res.statusCode).toBe(201);
    expect(signInWithOtp).toHaveBeenCalledWith({ email: 'sam@northeastern.edu', options: { shouldCreateUser: true } });
  });

  it('still rejects a taken username', async () => {
    repo.isUsernameTaken.mockResolvedValue(true);
    const res = await call(signup, { username: 'sam', email: 'sam@northeastern.edu' });
    expect(res.body.code).toBe('USERNAME_TAKEN');
    expect(signInWithOtp).not.toHaveBeenCalled();
  });
});
