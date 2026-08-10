'use client';

import { useState } from 'react';
import { apiUrl } from '@/lib/api';

type SimulationField = 'sleep_hours' | 'movement_minutes' | 'stress';

type SimulationResult = {
  field: SimulationField;
  current_average: number | null;
  simulated_average: number | null;
  data_points: number;
  data_quality: string;
  disclaimer: string;
};

const FIELD_OPTIONS: { id: SimulationField; label: string; unit: string; step: number }[] = [
  { id: 'sleep_hours', label: 'Schlafdauer', unit: 'h', step: 0.5 },
  { id: 'movement_minutes', label: 'Bewegung', unit: 'Min.', step: 5 },
  { id: 'stress', label: 'Stress (1-10)', unit: '', step: 1 },
];

/**
 * Wellness-Szenarien (Pro/Family): rein rechnerische Was-wäre-wenn-Projektion
 * des eigenen 7-Tage-Durchschnitts — keine KI, keine medizinische Vorhersage.
 * Backend: POST /api/profile/simulate (see services/lifestyle_simulation.py).
 */
export default function DashboardLifestyleSimulation() {
  const [field, setField] = useState<SimulationField>(FIELD_OPTIONS[0].id);
  const [delta, setDelta] = useState(0);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const authHeader = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const runSimulation = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(apiUrl('/api/profile/simulate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ field, delta }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(data?.detail ?? 'Simulation konnte nicht berechnet werden.');
        setResult(null);
        return;
      }
      setResult(data);
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar. Bitte später erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  const activeOption = FIELD_OPTIONS.find((option) => option.id === field) ?? FIELD_OPTIONS[0];

  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
      <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">Wellness-Szenarien</h3>
      <p className="mt-2 text-sm text-[#8E969F]">
        Simuliere rein rechnerisch, wie sich dein eigener 7-Tage-Durchschnitt verändern würde — keine Vorhersage, keine Diagnose.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <select
          value={field}
          onChange={(e) => {
            setField(e.target.value as SimulationField);
            setResult(null);
          }}
          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
        >
          {FIELD_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
        <input
          type="number"
          step={activeOption.step}
          value={delta}
          onChange={(e) => setDelta(Number(e.target.value))}
          placeholder={`Veränderung (${activeOption.unit})`}
          className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
        />
        <button
          onClick={() => void runSimulation()}
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-4 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Berechne...' : 'Simulieren'}
        </button>
      </div>

      {errorMessage && <p className="mt-3 text-xs text-red-300">{errorMessage}</p>}

      {result && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          {result.current_average === null ? (
            <p className="text-sm text-[#B7BDC4]">Noch nicht genügend Daten für {activeOption.label}.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 text-center text-sm">
                <div>
                  <p className="text-[#8E969F]">Aktueller Durchschnitt</p>
                  <p className="mt-1 text-lg font-semibold text-[#F5F2EA]">{result.current_average} {activeOption.unit}</p>
                </div>
                <div>
                  <p className="text-[#8E969F]">Simuliert</p>
                  <p className="mt-1 text-lg font-semibold text-[#58D7D4]">{result.simulated_average} {activeOption.unit}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-[#8E969F]">
                Grundlage: {result.data_points} Einträge · Datenqualität: {result.data_quality}
              </p>
            </>
          )}
          <p className="mt-3 text-xs text-[#8E969F]">{result.disclaimer}</p>
        </div>
      )}
    </article>
  );
}
