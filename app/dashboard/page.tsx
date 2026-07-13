'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type TwinResult = {
	biologisches_alter: number;
	differenz: number;
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
	const router = useRouter();

	useEffect(() => {
		if (!localStorage.getItem('token')) {
			router.push('/login');
		}
	}, [router]);

	const calculate = async () => {
		setLoading(true);
		try {
			const res = await fetch('http://localhost:8000/api/twin/calculate', {
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
				<button onClick={() => router.push('/login')} className="text-red-400">Abmelden</button>
			</div>

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
