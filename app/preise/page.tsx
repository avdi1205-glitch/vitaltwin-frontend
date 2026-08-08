import type { Metadata } from 'next';
import PreiseClient from './PreiseClient';

export const metadata: Metadata = {
  title: 'Preise & Tarife | VitalTwin',
  description:
    'Freemium-Modell: VitalTwin kostenlos starten, jederzeit upgraden. Vergleiche Free, Premium, Pro und Family — Preise, Funktionen und aktuellen Verfügbarkeitsstatus.',
  alternates: { canonical: '/preise' },
};

export default function PreisePage() {
  return <PreiseClient />;
}
