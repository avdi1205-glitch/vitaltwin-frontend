'use client';

import Link from 'next/link';

const EXAMPLE_RECOMMENDATIONS = [
  '20 Minuten spazieren',
  'Mehr Wasser trinken',
  'Heute früher schlafen',
  'Stress reduzieren',
];

/**
 * "Dein Twin empfiehlt" — an illustrative example card shown below the hero.
 * Clearly marked as an example, not a real personalized reading, since no
 * user is logged in on the public landing page yet.
 */
export default function TwinRecommendation() {
  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm md:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">Beispielhafte Ansicht</p>
      <h3 className="mt-3 font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-neutral-900">
        Dein Twin empfiehlt
      </h3>
      <p className="mt-2 text-sm text-neutral-600">Heute würde ich empfehlen:</p>

      <ul className="mt-5 space-y-3">
        {EXAMPLE_RECOMMENDATIONS.map((item) => (
          <li
            key={item}
            className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-[#F5EFE1] px-4 py-3 text-sm text-neutral-800"
          >
            <span className="font-[family-name:var(--font-mono-technical)] text-brand-gold">•</span>
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/?auth=register"
          className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Plan übernehmen
        </Link>
        <Link
          href="/ki-hinweise"
          className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-900"
        >
          Warum?
        </Link>
      </div>
      <p className="mt-4 text-xs text-neutral-500">
        Wellness-Orientierung, keine medizinische Empfehlung. Echte Empfehlungen erhältst du nach der Anmeldung auf
        Basis deiner eigenen, freiwillig eingetragenen Werte.
      </p>
    </div>
  );
}
