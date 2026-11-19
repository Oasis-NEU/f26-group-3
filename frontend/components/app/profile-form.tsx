"use client";

import { useState } from "react";
import { useMe } from "@/components/app/profile-gate";
import { Chip } from "@/components/chat-booth/chip";
import { PhotoStrip } from "@/components/chat-booth/photo-strip";
import { focusRing, primaryButton, secondaryButton } from "@/components/chat-booth/styles";
import { ApiError } from "@/lib/api";
import { type EditableProfile, type Profile, profileApi } from "@/lib/profile";
import { CAMPUSES, GENDERS, INTERESTS, MAX_INTERESTS, YEARS } from "@/lib/signup-options";
import { cn } from "@/lib/utils";
import { validateChoice, validateFirstName, validateMajor } from "@/lib/validation";

type Field = keyof EditableProfile;
type Errors = Partial<Record<Field, string>>;

const CHOICES = [
  { field: "year", legend: "year", options: YEARS },
  { field: "campus", legend: "campus", options: CAMPUSES },
  { field: "gender", legend: "gender", options: GENDERS },
] as const;

const VALIDATORS: Record<Field, (draft: EditableProfile) => string | null> = {
  firstName: (d) => validateFirstName(d.firstName),
  major: (d) => validateMajor(d.major),
  year: (d) => validateChoice(YEARS, "year")(d.year),
  campus: (d) => validateChoice(CAMPUSES, "campus")(d.campus),
  gender: (d) => validateChoice(GENDERS, "gender")(d.gender),
  interests: (d) => (d.interests.length === MAX_INTERESTS ? null : `pick exactly ${MAX_INTERESTS} sidequests.`),
};

const textInput = cn(
  "w-full rounded-2xl border-[1.5px] border-ink/25 bg-white px-4 py-2.5 text-base hover:border-ink aria-invalid:border-red-600",
  focusRing,
);

function editable(profile: Profile): EditableProfile {
  const { firstName, gender, year, major, campus, interests } = profile;
  return { firstName, gender, year, major, campus, interests };
}

// Only the fields that differ from what's saved, so PATCH sends the minimum.
function changedFields(saved: EditableProfile, draft: EditableProfile): Partial<EditableProfile> {
  return Object.fromEntries(
    (Object.keys(draft) as Field[])
      .filter((key) => JSON.stringify(draft[key]) !== JSON.stringify(saved[key]))
      .map((key) => [key, typeof draft[key] === "string" ? (draft[key] as string).trim() : draft[key]]),
  );
}

export function ProfileForm({ profile, onDone }: { profile: Profile; onDone: () => void }) {
  const { setMe } = useMe();
  const [draft, setDraft] = useState(() => editable(profile));
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends Field>(field: K, value: EditableProfile[K]) {
    setDraft((d) => ({ ...d, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function toggleInterest(interest: string) {
    const picked = draft.interests.includes(interest);
    set("interests", picked ? draft.interests.filter((i) => i !== interest) : [...draft.interests, interest]);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const found: Errors = {};
    for (const field of Object.keys(VALIDATORS) as Field[]) {
      const message = VALIDATORS[field](draft);
      if (message) found[field] = message;
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const changes = changedFields(editable(profile), draft);
    if (Object.keys(changes).length === 0) return onDone();

    setSaving(true);
    try {
      setMe(await profileApi.update(changes));
      onDone();
    } catch (err) {
      if (err instanceof ApiError && err.field && err.field in VALIDATORS) {
        setErrors({ [err.field]: err.message.toLowerCase() });
      } else {
        setFormError(err instanceof ApiError ? err.message : "something went wrong. please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  const full = draft.interests.length >= MAX_INTERESTS;

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-8 md:flex-row-reverse md:items-start md:justify-between">
      <div className="flex justify-center md:w-64">
        <PhotoStrip picks={draft.interests} />
      </div>

      <div className="flex flex-1 flex-col gap-6 md:max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight">edit your profile</h1>

        <TextField id="firstName" label="first name" value={draft.firstName} error={errors.firstName}
          autoComplete="given-name" onChange={(v) => set("firstName", v)} />
        <TextField id="major" label="major" value={draft.major} error={errors.major}
          onChange={(v) => set("major", v)} />

        {CHOICES.map(({ field, legend, options }) => (
          <ChipGroup key={field} legend={legend} error={errors[field]}>
            {options.map((option) => (
              <Chip key={option} selected={draft[field] === option} onClick={() => set(field, option)}>
                {option}
              </Chip>
            ))}
          </ChipGroup>
        ))}

        <ChipGroup
          legend={`sidequests (${draft.interests.length}/${MAX_INTERESTS})`}
          hint={full ? "unpick one to swap it out." : undefined}
          error={errors.interests}
        >
          {INTERESTS.map((interest) => {
            const picked = draft.interests.includes(interest);
            return (
              <Chip key={interest} selected={picked} disabled={full && !picked} onClick={() => toggleInterest(interest)}>
                {interest}
              </Chip>
            );
          })}
        </ChipGroup>

        {formError && (
          <p role="alert" className="text-sm font-medium text-red-700">
            {formError}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className={primaryButton}>
            {saving ? "saving…" : "save changes"}
          </button>
          <button type="button" disabled={saving} onClick={onDone} className={secondaryButton}>
            cancel
          </button>
        </div>
      </div>
    </form>
  );
}

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  error?: string;
  autoComplete?: string;
  onChange: (value: string) => void;
};

function TextField({ id, label, value, error, autoComplete, onChange }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      <input
        id={id}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={textInput}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

type ChipGroupProps = { legend: string; hint?: string; error?: string; children: React.ReactNode };

function ChipGroup({ legend, hint, error, children }: ChipGroupProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-bold">{legend}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
      {hint && <p className="text-xs text-soft">{hint}</p>}
      <FieldError message={error} />
    </fieldset>
  );
}

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm font-medium text-red-700">
      {message}
    </p>
  );
}
