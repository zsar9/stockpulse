"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function StockDetailPage() {
	const params = useParams<{ ticker: string }>();
	const ticker = (params?.ticker ?? '').toString().toUpperCase();
	const [data, setData] = useState<any>(null);
	useEffect(() => {
		if (!ticker) return;
		fetch(`/api/stock/${ticker}`).then(r => r.json()).then(setData);
	}, [ticker]);

	if (!data) return <div className="text-sm text-gray-400">Loading…</div>;

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<div className="h-10 w-10 rounded-full overflow-hidden bg-gray-800 border border-gray-700">
					{data.logoUrl ? <img src={data.logoUrl} alt="logo" className="h-full w-full object-cover" /> : null}
				</div>
				<div>
					<h2 className="text-xl font-semibold">{ticker} <span className="text-gray-400 text-base">{data.name}</span></h2>
					<div className="text-sm text-gray-400">Price ${data.price.toFixed(2)} • Predicted 14d {(data.predictedGrowthPct >= 0 ? '+' : '') + data.predictedGrowthPct.toFixed(2)}%</div>
				</div>
			</div>
			<div className="card p-4">
				<div className="h-64">
					<ResponsiveContainer>
						<LineChart data={data.chart.map((v: any) => ({ date: v.t, value: v.c }))}>
							<XAxis dataKey="date" hide />
							<YAxis hide domain={['auto', 'auto']} />
							<Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937' }} labelStyle={{ color: '#9ca3af' }} />
							<Line type="monotone" dataKey="value" stroke="#22d3ee" dot={false} />
						</LineChart>
					</ResponsiveContainer>
				</div>
			</div>
			<div className="card p-4">
				<h3 className="font-medium mb-3">Recent News</h3>
				<ul className="space-y-2 text-sm list-disc list-inside text-gray-300">
					{data.news.map((n: any, i: number) => (
						<li key={i}><a className="hover:underline" href={n.url} target="_blank" rel="noreferrer">{n.headline}</a> <span className="text-xs text-gray-500">{new Date(n.time).toLocaleString()}</span></li>
					))}
				</ul>
			</div>
		</div>
	);
}