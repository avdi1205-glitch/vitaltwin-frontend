import type { Metadata } from 'next';
import GoogleHealthConnect from '../../components/GoogleHealthConnect';

export const metadata: Metadata = {
  title: 'Gesundheitsdaten',
};

/**
 * Gesundheitsdaten is the CATEGORY (nav label, room for future sources);
 * on the page itself Google Health — the one real, working integration
 * today — is the dominant hero title, per explicit design instruction.
 * No functional change: still just the existing <GoogleHealthConnect />.
 */
export default function GesundheitsdatenPage() {
  return (
    <section className="mt-8 scroll-mt-24">
      <p className="font-[family-name:var(--font-mono-technical)] text-xs uppercase tracking-[0.22em] text-[#8E969F]">
        Gesundheitsdaten
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-serif-display)] text-4xl font-semibold text-[#F5F2EA] md:text-6xl">
        Google Health
      </h1>
      <p className="mt-4 max-w-2xl text-[#B7BDC4]">
        Verbinde und synchronisiere deine Gesundheitsdaten mit VitalTwin — heute über Google Health, Basis für
        weitere Datenquellen in Zukunft.
      </p>

      <div className="mt-8">
        <GoogleHealthConnect />
      </div>
    </section>
  );
}
