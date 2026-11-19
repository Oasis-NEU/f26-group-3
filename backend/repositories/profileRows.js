import { STORED_VALUE } from '../validation/profile.js';

// Converts between database rows and the Profile the API returns. Rows use
// snake_case columns and store choices as short codes ('non_binary',
// 'boston', 'night_out'); the API uses camelCase and the labels students see.

// API field -> user_information column
const INFO_COLUMN_FOR = {
  firstName: 'first_name',
  year: 'academic_year',
  gender: 'gender',
  major: 'major',
  campus: 'campus',
  interests: 'interests',
};

// stored value -> label, per field
const LABEL_FOR = Object.fromEntries(
  Object.entries(STORED_VALUE).map(([field, map]) => [
    field,
    Object.fromEntries(Object.entries(map).map(([label, stored]) => [stored, label])),
  ]),
);

const label = (field, stored) => LABEL_FOR[field][stored] ?? stored;
const store = (field, value) => STORED_VALUE[field][value] ?? value;

export function toProfile(user, info) {
  return {
    username: user.username,
    email: user.northeastern_email,
    firstName: info.first_name ?? '',
    year: label('year', info.academic_year),
    gender: info.gender ? label('gender', info.gender) : '',
    major: info.major ?? '',
    campus: label('campus', info.campus),
    interests: (info.interests ?? []).map((i) => label('interests', i)),
  };
}

export function toInfoRow(fields) {
  return Object.fromEntries(
    Object.entries(fields)
      .filter(([key]) => key in INFO_COLUMN_FOR)
      .map(([key, value]) => {
        if (key === 'interests') return [INFO_COLUMN_FOR[key], value.map((i) => store('interests', i))];
        return [INFO_COLUMN_FOR[key], key in STORED_VALUE ? store(key, value) : value];
      }),
  );
}
