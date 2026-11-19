// Shown when the account exists but signup never saved a profile.
export function MissingProfile() {
  return (
    <section aria-labelledby="missing-heading" className="mx-auto max-w-md rounded-3xl bg-white p-6 text-center">
      <h1 id="missing-heading" className="text-xl font-bold">
        your profile isn&apos;t set up yet
      </h1>
      <p className="mt-2 text-sm text-soft">
        it looks like signup didn&apos;t finish. ask the sidequest team to reset your account so you can sign up again.
      </p>
    </section>
  );
}
