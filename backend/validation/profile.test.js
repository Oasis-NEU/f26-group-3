import { describe, expect, it } from 'vitest';
import { validateNewProfile, validateProfileUpdate } from './profile.js';

const fullProfile = {
  firstName: 'Sam',
  gender: 'non-binary',
  year: '2nd',
  major: 'Computer Science',
  campus: 'Boston',
  interests: ['concert buddies', 'cafe hopping', 'gym buddies'],
};

describe('validateProfileUpdate', () => {
  it('accepts a partial update and trims text', () => {
    expect(validateProfileUpdate({ firstName: '  Sam ', major: ' Undeclared ' })).toEqual({
      value: { firstName: 'Sam', major: 'Undeclared' },
    });
  });

  it('rejects an empty update', () => {
    expect(validateProfileUpdate({}).error).toBe('Nothing to update.');
  });

  it.each([null, [], 'firstName'])('rejects a non-object body (%j)', (body) => {
    expect(validateProfileUpdate(body).error).toBeTruthy();
  });

  it.each(['username', 'email', 'user_id'])('rejects fields that cannot be edited (%s)', (key) => {
    expect(validateProfileUpdate({ [key]: 'x' })).toMatchObject({ field: key });
  });

  it.each([
    ['firstName', '   '],
    ['firstName', 'a'.repeat(41)],
    ['firstName', 42],
    ['major', 'a'.repeat(61)],
    ['gender', 'Woman'],
    ['year', '6th'],
    ['campus', 'boston'],
  ])('rejects an invalid %s (%j)', (field, value) => {
    expect(validateProfileUpdate({ [field]: value })).toMatchObject({ field });
  });

  it.each([
    [['concert buddies', 'cafe hopping']],
    [['concert buddies', 'cafe hopping', 'gym buddies', 'night out']],
    [['concert buddies', 'concert buddies', 'cafe hopping']],
    [['concert buddies', 'cafe hopping', 'skydiving']],
    ['concert buddies'],
  ])('rejects interests that are not exactly 3 from the list (%j)', (interests) => {
    expect(validateProfileUpdate({ interests })).toMatchObject({ field: 'interests' });
  });

  it('reports the field of the first problem', () => {
    expect(validateProfileUpdate({ firstName: 'Sam', year: 'nope' })).toMatchObject({ field: 'year' });
  });
});

describe('validateNewProfile', () => {
  it('accepts a complete profile', () => {
    expect(validateNewProfile(fullProfile)).toEqual({ value: fullProfile });
  });

  it('requires every field', () => {
    const { campus, ...withoutCampus } = fullProfile;
    expect(validateNewProfile(withoutCampus)).toMatchObject({ field: 'campus' });
  });

  it('ignores extra signup fields like username and password', () => {
    expect(validateNewProfile({ ...fullProfile, username: 'sam', password: 'secret' })).toEqual({ value: fullProfile });
  });
});
