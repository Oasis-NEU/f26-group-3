"use client";

import { ChatForm, type ChatStep } from "@/components/chat-booth/chat-form";
import { useSignup } from "@/components/auth/signup-context";
import { CAMPUSES, GENDERS, YEARS } from "@/lib/signup-options";
import { FIRST_NAME_MAX, MAJOR_MAX, validateChoice, validateFirstName, validateMajor } from "@/lib/validation";

const steps: ChatStep[] = [
  {
    key: "firstName",
    question: "what's your first name?",
    hint: "matches only ever see your first name.",
    kind: "text",
    placeholder: "first name",
    autoComplete: "given-name",
    maxLength: FIRST_NAME_MAX,
    validate: validateFirstName,
  },
  {
    key: "gender",
    question: "how do you identify?",
    kind: "chips",
    options: GENDERS,
    validate: validateChoice(GENDERS, "gender"),
  },
  {
    key: "year",
    question: "what year are you in?",
    kind: "chips",
    options: YEARS,
    validate: validateChoice(YEARS, "year"),
  },
  {
    key: "major",
    question: "what's your major?",
    kind: "text",
    placeholder: "e.g. computer science",
    maxLength: MAJOR_MAX,
    validate: validateMajor,
  },
  {
    key: "campus",
    question: "which campus are you on?",
    kind: "chips",
    options: CAMPUSES,
    validate: validateChoice(CAMPUSES, "campus"),
  },
];

export function DetailsForm() {
  const { data, update } = useSignup();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
      <ChatForm
        title="sidequest signup"
        subtitle="step 2 of 3 · about you"
        label="About you chat"
        intro={[
          data.username ? `nice to meet you, @${data.username}!` : "nice to meet you!",
          "a few quick ones so we can find your people.",
        ]}
        steps={steps}
        values={{
          firstName: data.firstName,
          gender: data.gender,
          year: data.year,
          major: data.major,
          campus: data.campus,
        }}
        onAnswer={(key, value) => update({ [key]: value })}
        onReset={() => update({ firstName: "", gender: "", year: "", major: "", campus: "" })}
        closing={["got it, thanks!", "last step: pick what you're into and we'll print your strip 📸"]}
        next={{ href: "/signup/interests" }}
      />
    </div>
  );
}
