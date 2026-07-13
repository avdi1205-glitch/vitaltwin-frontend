'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiUrl } from '@/lib/api';

type TwinResult = {
	biologisches_alter: number;
	differenz: number;
};

type MeResponse = {
	email: string;
	full_name?: string;
	premium: boolean;
};

export default function Dashboard() {
	const [form, setForm] = useState({
		age: 42,
		gender: 'männlich',
		hba1c: 5.4,
		crp: 0.8,
		vitamin_d: 55,
		apob: 65
	});
	const [twin, setTwin] = useState<TwinResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [plan, setPlan] = useState<'starter' | 'premium'>('starter');
	const [planLoading, setPlanLoading] = useState(true);
	const [paymentNotice, setPaymentNotice] = useState('');
	const router = useRouter();
	const searchParams = useSearchParams();

	const fetchMe = async (token: string): Promise<MeResponse> => {
		const res = await fetch(apiUrl('/api/users/me'), {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!res.ok) {
			throw new Error('me-failed');
		}

		return (await res.json()) as MeResponse;
	};

	useEffect(() => {
		const token = localStorage.getItem('token');
		if (!token) {
			router.push('/login');
			return;
		}

		let cancelled = false;
		queueMicrotask(() => {
			if (!cancelled) {
				setPlanLoading(true);
			}
		});

		void fetchMe(token)
			.then((data) => {
				if (!cancelled) {
					setPlan(data.premium ? 'premium' : 'starter');
				}
			})
			.catch(() => {
				if (!cancelled) {
					localStorage.removeItem('token');
					router.push('/login');
				}
			})
			.finally(() => {
				if (!cancelled) {
					setPlanLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [router]);

	useEffect(() => {
		const payment = searchParams.get('payment');
		const token = localStorage.getItem('token');
		if (payment !== 'success' || !token) {
			return;
		}

		const kickoffTimer = setTimeout(() => {
			setPaymentNotice('Zahlung erkannt. Premium wird geprüft...');
		}, 0);
		let attempts = 0;
		const interval = setInterval(() => {
			attempts += 1;
			void fetchMe(token)
				.then((data) => {
					setPlan(data.premium ? 'premium' : 'starter');
					if (data.premium) {
						setPaymentNotice('Premium ist jetzt aktiv.');
						clearInterval(interval);
					}
				})
				.catch(() => {
					// Ignore transient errors while waiting for webhook processing.
				});

			if (attempts >= 8) {
				clearInterval(interval);
				setPaymentNotice('Premium-Status wird noch synchronisiert. Bitte Seite in 1-2 Minuten neu laden.');
			}
		}, 3000);

		return () => {
			clearTimeout(kickoffTimer);
			clearInterval(interval);
		};
	}, [searchParams]);

	const calculate = async () => {
		setLoading(true);
		try {
			const res = await fetch(apiUrl('/api/twin/calculate'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			});
			const data = await res.json();
			setTwin(data);
		} catch {
			alert('Fehler bei der Berechnung');
		}
		setLoading(false);
	};

	return (
		<div className="p-8 max-w-5xl mx-auto bg-slate-950 min-h-screen text-white">
			<div className="flex justify-between items-center mb-10">
				<h1 className="text-5xl font-bold">VitalTwin Dashboard</h1>
				<div className="flex items-center gap-4">
					<div className={`rounded-full px-4 py-1 text-sm font-semibold ${plan === 'premium' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-200'}`}>
						Plan: {planLoading ? 'Lade...' : plan === 'premium' ? 'Premium' : 'Starter'}
					</div>
					<button
						onClick={() => {
							localStorage.removeItem('token');
							router.push('/login');
						}}
						className="text-red-400"
					>
						Abmelden
					</button>
				</div>
			</div>

			{paymentNotice && (
				<div className="mb-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
					{paymentNotice}
				</div>
			)}

			{!planLoading && plan !== 'premium' && (
				<div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
					Du nutzt aktuell Starter. Upgrade auf Premium unter /preise fuer alle Premium-Funktionen.
				</div>
			)}

			<div className="grid md:grid-cols-2 gap-8">
				{/* Eingabefelder */}
				<div className="bg-slate-900 p-8 rounded-3xl">
					<h2 className="text-2xl mb-6">Deine Werte</h2>
					<div className="space-y-6">
						<div>
							<label className="block mb-2">Alter</label>
							<input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} className="w-full p-4 bg-slate-800 rounded-2xl" />
						</div>
						<div>
							<label className="block mb-2">Geschlecht</label>
							<select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full p-4 bg-slate-800 rounded-2xl">
								<option value="männlich">Männlich</option>
								<option value="weiblich">Weiblich</option>
							</select>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block mb-2">HbA1c</label>
								<input type="number" step="0.1" value={form.hba1c} onChange={(e) => setForm({ ...form, hba1c: Number(e.target.value) })} className="w-full p-4 bg-slate-800 rounded-2xl" />
							</div>
							<div>
								<label className="block mb-2">CRP</label>
								<input type="number" step="0.1" value={form.crp} onChange={(e) => setForm({ ...form, crp: Number(e.target.value) })} className="w-full p-4 bg-slate-800 rounded-2xl" />
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block mb-2">Vitamin D</label>
								<input type="number" value={form.vitamin_d} onChange={(e) => setForm({ ...form, vitamin_d: Number(e.target.value) })} className="w-full p-4 bg-slate-800 rounded-2xl" />
							</div>
							<div>
								<label className="block mb-2">ApoB</label>
								<input type="number" value={form.apob} onChange={(e) => setForm({ ...form, apob: Number(e.target.value) })} className="w-full p-4 bg-slate-800 rounded-2xl" />
							</div>
						</div>
					</div>
					<button onClick={calculate} disabled={loading} className="mt-8 w-full bg-blue-600 py-4 rounded-2xl text-lg font-semibold">
						{loading ? 'Berechne...' : 'Twin berechnen'}
					</button>
				</div>

				{/* Ergebnis */}
				{twin && (
					<div className="bg-slate-900 p-8 rounded-3xl">
						<h2 className="text-3xl mb-6">Dein Ergebnis</h2>
						<p className="text-7xl font-bold text-blue-400">{twin.biologisches_alter} Jahre</p>
						<p className="text-2xl mt-4">Differenz: {twin.differenz} Jahre</p>
					</div>
				)}
			</div>
		</div>
	);
}
