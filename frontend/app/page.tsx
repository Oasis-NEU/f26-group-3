import Link from "next/link";
import { cn } from "@/lib/utils";
import { primaryButton, secondaryButton } from "@/components/chat-booth/styles";
import { HeaderLink, SiteHeader } from "@/components/site-header";
import { Bubble } from "@/components/chat-booth/bubble";
import { PhotoStrip } from "@/components/chat-booth/photo-strip";
import { INTERESTS, MAX_INTERESTS } from "@/lib/signup-options";

const STEPS = [
  {
    title: "sign up with your husky email",
    body: "only @northeastern.edu addresses get in, so everyone here is a real student.",
    fill: "bg-frame1",
  },
  {
    title: `pick ${MAX_INTERESTS} sidequests`,
    body: "concerts, study groups, cafe hopping. each pick prints into your photo strip.",
    fill: "bg-frame2",
  },
  {
    title: "find your people",
    body: "see who's down for the same things and make plans that actually happen.",
    fill: "bg-frame3",
  },
];

const GALLERY = [
  { label: "students at a concert", rotate: "-rotate-2" },
  { label: "study group in Snell Library", rotate: "rotate-1" },
  { label: "friends at a cafe near campus", rotate: "-rotate-1" },
];

// Stand-in for a real photo until we have assets. Swap for next/image with the
// same aspect ratio so the layout doesn't shift.
function ImagePlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={`placeholder: ${label}`}
      className={cn(
        "flex items-center justify-center rounded-2xl border-[1.5px] border-dashed border-ink/30 bg-white/60 p-4 text-center text-xs font-medium text-soft",
        className,
      )}
    >
      <span>
        <span aria-hidden className="mb-1 block text-2xl">📷</span>
        {label}
      </span>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-page font-sans text-ink">
      <SiteHeader>
        <HeaderLink href="/login">log in</HeaderLink>
        <Link href="/signup" className={cn(primaryButton, "px-4 py-2")}>
          sign up
        </Link>
      </SiteHeader>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div className="flex flex-col gap-5">
            <p className="w-fit rounded-full bg-frame1 px-3 py-1 text-xs font-semibold">for northeastern students</p>
            <h1 className="text-4xl leading-tight font-bold tracking-tight md:text-5xl">
              find people to do things with.
            </h1>
            <p className="max-w-md text-base text-soft">
              sidequest matches you with other huskies who are into the same stuff, from concert buddies to late-night
              study groups.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup" className={primaryButton}>
                start your sidequest →
              </Link>
              <Link href="/login" className={secondaryButton}>
                i have an account
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <ImagePlaceholder label="hero photo: friends hanging out on campus (4:3)" className="aspect-[4/3] w-full pr-28 md:pr-36" />
            <PhotoStrip
              picks={INTERESTS.slice(0, MAX_INTERESTS)}
              className="absolute -right-2 -bottom-10 scale-75 md:-right-8 md:scale-90"
            />
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="how-heading" className="border-y border-ink/10 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-14">
            <h2 id="how-heading" className="text-2xl font-bold">
              how it works
            </h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex flex-col gap-3 rounded-2xl bg-page p-5">
                  <span
                    aria-hidden
                    className={cn("flex size-9 items-center justify-center rounded-full text-sm font-bold", step.fill)}
                  >
                    {i + 1}
                  </span>
                  <h3 className="text-base font-bold">{step.title}</h3>
                  <p className="text-sm text-soft">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Product preview: the signup chat */}
        <section aria-labelledby="chat-heading" className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-14 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 id="chat-heading" className="text-2xl font-bold">
              signing up feels like texting a friend
            </h2>
            <p className="text-sm text-soft">
              no long forms. answer a few quick questions, pick your sidequests, and you&apos;re in.
            </p>
            <ul aria-label="Popular sidequests" className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <li
                  key={interest}
                  className="rounded-full border-[1.5px] border-ink bg-white px-3.5 py-1.5 text-[13.5px] font-medium"
                >
                  {interest}
                </li>
              ))}
            </ul>
          </div>
          <div aria-hidden className="flex flex-col gap-2 rounded-3xl bg-white/60 p-5 ring-1 ring-ink/10">
            <Bubble from="app">hey! what should we call you?</Bubble>
            <Bubble from="me">sam</Bubble>
            <Bubble from="app">nice to meet you, sam. pick {MAX_INTERESTS} sidequests you&apos;re into 📸</Bubble>
            <Bubble from="me">concert buddies, cafe hopping, gym buddies</Bubble>
          </div>
        </section>

        {/* Gallery */}
        <section aria-labelledby="gallery-heading" className="mx-auto max-w-5xl px-4 pb-14">
          <h2 id="gallery-heading" className="text-2xl font-bold">
            sidequests happening around campus
          </h2>
          <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-6">
            {GALLERY.map((photo) => (
              <ImagePlaceholder
                key={photo.label}
                label={`${photo.label} (4:5)`}
                className={cn("aspect-[4/5] bg-white p-2 shadow-sm sm:p-4", photo.rotate)}
              />
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="px-4 pb-16">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 rounded-3xl bg-ink px-6 py-12 text-center text-white">
            <h2 className="text-2xl font-bold md:text-3xl">your next sidequest is waiting.</h2>
            <p className="max-w-md text-sm text-white/75">it takes about two minutes to make your strip.</p>
            <Link href="/signup" className={cn(primaryButton, "focus-visible:ring-white focus-visible:ring-offset-ink")}>
              sign up free →
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-soft sm:flex-row">
          <p>sidequest · made by students, for students</p>
          <p>northeastern university students only</p>
        </div>
      </footer>
    </div>
  );
}
