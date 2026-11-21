import { beforeEach, describe, expect, it, vi } from 'vitest';

// Minimal stand-in for the Supabase query builder: records calls per table and
// returns the error queued for that table's upsert/insert.
const calls = [];
const errors = {};
vi.mock('../config/supabase.js', () => {
  const table = (name) => ({
    upsert: (row, opts) => (calls.push([name, 'upsert', row, opts]), Promise.resolve({ error: errors[name] ?? null })),
    insert: (row) => (calls.push([name, 'insert', row]), Promise.resolve({ error: errors[name] ?? null })),
    delete: () => ({ eq: (col, val) => (calls.push([name, 'delete', col, val]), Promise.resolve({ error: null })) }),
    select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
  });
  return { supabase: { from: table } };
});

const { createProfile, AlreadyOnboardedError, UsernameTakenError } = await import('./profiles.repository.js');

const fields = { username: 'sam', email: 'sam@northeastern.edu', firstName: 'Sam', interests: [] };
const deletes = () => calls.filter(([, op]) => op === 'delete');

beforeEach(() => {
  calls.length = 0;
  for (const key of Object.keys(errors)) delete errors[key];
});

describe('createProfile', () => {
  it("upserts the users row so a student's leftover row from a failed signup is reused", async () => {
    await createProfile('user-1', fields);
    expect(calls[0]).toEqual([
      'users',
      'upsert',
      { user_id: 'user-1', username: 'sam', northeastern_email: 'sam@northeastern.edu' },
      { onConflict: 'user_id' },
    ]);
  });

  it('keeps the users row when another request already created the profile', async () => {
    errors.user_information = { code: '23505', message: 'duplicate key value violates unique constraint' };
    await expect(createProfile('user-1', fields)).rejects.toBeInstanceOf(AlreadyOnboardedError);
    expect(deletes()).toEqual([]);
  });

  it('undoes the users row when the profile insert fails for another reason', async () => {
    errors.user_information = { code: '23514', message: 'check constraint' };
    await expect(createProfile('user-1', fields)).rejects.toThrow('Failed to create profile');
    expect(deletes()).toEqual([['users', 'delete', 'user_id', 'user-1']]);
  });

  it('reports a taken username', async () => {
    errors.users = { code: '23505', message: 'duplicate key value violates unique constraint "users_username_key"' };
    await expect(createProfile('user-1', fields)).rejects.toBeInstanceOf(UsernameTakenError);
  });
});
