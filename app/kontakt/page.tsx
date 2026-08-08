import type { Metadata } from 'next';
import KontaktClient from './KontaktClient';

export const metadata: Metadata = {
  title: 'Kontakt | VitalTwin',
  description:
    'Fragen, Feedback oder Anliegen zu VitalTwin? Kontaktiere uns über das Formular oder direkt per E-Mail an info@vitaltwin.de.',
  alternates: { canonical: '/kontakt' },
};

export default function KontaktPage() {
  return <KontaktClient />;
}
