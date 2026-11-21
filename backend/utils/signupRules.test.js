import { describe, expect, it } from 'vitest';
import { isCode, isStudentEmail, isUsername, normalizeEmail, normalizeUsername } from './signupRules.js';

describe('isStudentEmail', () => {
  it('accepts northeastern.edu addresses', () => {
    expect(isStudentEmail('sam.lee+test@northeastern.edu')).toBe(true);
  });

  it.each(['sam@gmail.com', 'sam@northeastern.edu.evil.com', "o'brien@northeastern.edu", '@northeastern.edu', ''])(
    'rejects %j',
    (email) => expect(isStudentEmail(email)).toBe(false),
  );

  it('only matches after normalizing case and spaces', () => {
    expect(isStudentEmail('Sam@Northeastern.edu')).toBe(false);
    expect(isStudentEmail(normalizeEmail('  Sam@Northeastern.edu '))).toBe(true);
  });
});

describe('isUsername', () => {
  it.each(['sam', 'husky_explorer', 'a.b_c', 'x'.repeat(20)])('accepts %j', (name) => expect(isUsername(name)).toBe(true));
  it.each(['ab', 'x'.repeat(21), 'has space', 'dash-name', ''])('rejects %j', (name) => expect(isUsername(name)).toBe(false));

  it('lowercases when normalizing', () => {
    expect(normalizeUsername(' Husky ')).toBe('husky');
    expect(normalizeUsername(undefined)).toBe('');
  });
});

describe('isCode', () => {
  it('accepts exactly 6 digits', () => expect(isCode('012345')).toBe(true));
  it.each(['12345', '1234567', '12a456', ''])('rejects %j', (code) => expect(isCode(code)).toBe(false));
});
