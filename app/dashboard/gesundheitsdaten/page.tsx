import type { Metadata } from 'next';
import GoogleHealthConnect from '../../components/GoogleHealthConnect';
import HealthConnectSync from '../../components/HealthConnectSync';

export const metadata: Metadata = {
  title: 'Gesundheitsdaten',
};

/**
 * Gesundheitsdaten is the CATEGORY (nav label, room for future sources);
 * on the page itself Google Health and Health Connect each get their own
 * hero-style section with comparable visual weight — neither is a small
 * afterthought card under the other. <HealthConnectSync /> now owns its
 * OWN heading/description too (not just the connect controls), so the
 * entire section — heading included — is absent outside native Android
 * (Health Connect Phase 2.2), never an empty heading with no controls.
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

      <HealthConnectSync />
    </section>
  );
}
