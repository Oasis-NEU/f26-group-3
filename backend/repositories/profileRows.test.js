import { describe, expect, it } from 'vitest';
import { toInfoRow, toProfile } from './profileRows.js';

const user = { username: 'sam', northeastern_email: 'sam@northeastern.edu' };
const info = {
  first_name: 'Sam',
  academic_year: 'grad',
  gender: 'non_binary',
  major: 'Computer Science',
  campus: 'nyc',
  interests: ['concert', 'night_out', 'dialogue'],
};
const profile = {
  username: 'sam',
  email: 'sam@northeastern.edu',
  firstName: 'Sam',
  year: 'grad',
  gender: 'non-binary',
  major: 'Computer Science',
  campus: 'NYC',
  interests: ['concert buddies', 'night out', 'dialogue buddies'],
};

describe('toProfile', () => {
  it('turns stored codes into labels', () => {
    expect(toProfile(user, info)).toEqual(profile);
  });

  it('fills missing optional columns with empty values', () => {
    expect(toProfile(user, { ...info, first_name: null, major: null, gender: null, interests: null })).toMatchObject({
      firstName: '',
      major: '',
      gender: '',
      interests: [],
    });
  });
});

describe('toInfoRow', () => {
  it('turns labels into stored codes and camelCase into columns', () => {
    const { username, email, ...fields } = profile;
    expect(toInfoRow(fields)).toEqual(info);
  });

  it('only includes the fields that were given', () => {
    expect(toInfoRow({ campus: 'Boston', username: 'ignored' })).toEqual({ campus: 'boston' });
  });
});
