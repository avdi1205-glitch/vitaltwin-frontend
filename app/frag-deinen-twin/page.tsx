'use client';

import Link from 'next/link';

const EXAMPLE_QUESTIONS = [
  'Wie lief meine Woche?',
  'Was kann ich heute verbessern?',
  'Welche Gewohnheit hat den größten Einfluss?',
];

export default function FragDeinenTwin() {
  return (
    <div className="min-h-screen bg-[#F5EFE1] px-6 py-16 text-neutral-900">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">VitalTwin Intelligence</p>
        <h1 className="mt-2 font-[family-name:var(--font-serif-display)] text-4xl font-semibold">Frag deinen Twin</h1>
        <p className="mt-4 text-neutral-700">
          Ein Chat mit deinem digitalen Zwilling ist in Vorbereitung und folgt in einem der nächsten Releases.
        </p>

        <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-7">
          <p className="text-sm font-semibold text-neutral-900">Das wirst du bald fragen können:</p>
          <ul className="mt-4 space-y-3">
            {EXAMPLE_QUESTIONS.map((question) => (
              <li key={question} className="rounded-xl border border-neutral-200 bg-[#F5EFE1] px-4 py-3 text-sm text-neutral-800">
                {question}
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled
            className="mt-6 w-full cursor-not-allowed rounded-2xl bg-neutral-200 py-3 text-sm font-semibold text-neutral-500"
          >
            Bald verfügbar
          </button>
        </div>

        <Link href="/dashboard" className="mt-8 inline-block text-sm font-semibold text-neutral-900 underline hover:text-black">
          Zurück zum Dashboard
        </Link>
      </div>
    </div>
  );
}
