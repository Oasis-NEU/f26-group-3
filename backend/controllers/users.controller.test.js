import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../repositories/profiles.repository.js', () => {
  class UsernameTakenError extends Error {}
  class AlreadyOnboardedError extends Error {}
  return {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    createProfile: vi.fn(),
    isUsernameTaken: vi.fn(),
    UsernameTakenError,
    AlreadyOnboardedError,
  };
});

const repo = await import('../repositories/profiles.repository.js');
const { createMe } = await import('./users.controller.js');

const user = { id: 'user-1', email: 'sam@northeastern.edu' };
const body = {
  email: 'Sam@Northeastern.edu',
  username: 'sam',
  firstName: 'Sam',
  gender: 'non-binary',
  year: '2nd',
  major: 'Computer Science',
  campus: 'Boston',
  interests: ['concert buddies', 'cafe hopping', 'gym buddies'],
};

function fakeRes() {
  const res = { statusCode: 200, body: undefined };
  res.status = (code) => ((res.statusCode = code), res);
  res.json = (data) => ((res.body = data), res);
  return res;
}

async function post(overrides = {}) {
  const res = fakeRes();
  await createMe({ user, body: { ...body, ...overrides } }, res);
  return res;
}

beforeEach(() => {
  vi.resetAllMocks();
  repo.getProfile.mockResolvedValue(null);
  repo.isUsernameTaken.mockResolvedValue(false);
  repo.createProfile.mockResolvedValue({ username: 'sam' });
});

describe('createMe', () => {
  it('saves the profile with the session email', async () => {
    const res = await post();
    expect(res.statusCode).toBe(201);
    expect(repo.createProfile).toHaveBeenCalledWith('user-1', expect.objectContaining({ email: 'sam@northeastern.edu' }));
  });

  it('refuses when the session belongs to a different email', async () => {
    const res = await post({ email: 'alex@northeastern.edu' });
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('WRONG_ACCOUNT');
    expect(repo.createProfile).not.toHaveBeenCalled();
  });

  it('refuses when no email is sent', async () => {
    const res = await post({ email: undefined });
    expect(res.body.code).toBe('WRONG_ACCOUNT');
  });

  it("ignores the student's own leftover username when checking it is free", async () => {
    await post();
    expect(repo.isUsernameTaken).toHaveBeenCalledWith('sam', 'user-1');
  });

  it('answers 409 ALREADY_ONBOARDED when a second submit loses the race', async () => {
    repo.createProfile.mockRejectedValue(new repo.AlreadyOnboardedError());
    const res = await post();
    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe('ALREADY_ONBOARDED');
  });

  it('answers 409 USERNAME_TAKEN when the username is taken at insert time', async () => {
    repo.createProfile.mockRejectedValue(new repo.UsernameTakenError());
    const res = await post();
    expect(res.body.code).toBe('USERNAME_TAKEN');
  });
});
