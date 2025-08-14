"use client";
import useSWR from 'swr';
import Sparkline from './Sparkline';
import numeral from 'numeral';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export type StockRow = {
	id: string;
	ticker: string;
	name: string;
	logoUrl?: string;
	price: number;
	priceChangePct: number;
	marketCap: number;
	predictedGrowthPct: number;
	newsHeadlines: string[];
	sparkline: number[];
};

type ApiResponse = {
	stocks: StockRow[];
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function StocksTable() {
	const [sort, setSort] = useState<'predictedGrowthPct' | 'marketCap' | 'price' | 'priceChangePct'>('predictedGrowthPct');
	const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
	const query = useMemo(() => `/api/stocks?limit=200&sort=${sort}&direction=${direction}`, [sort, direction]);
	const { data } = useSWR<ApiResponse>(query, fetcher);
	const stocks = data?.stocks ?? [];

	function onSort(col: typeof sort) {
		if (sort === col) setDirection(direction === 'asc' ? 'desc' : 'asc');
		else { setSort(col); setDirection(col === 'predictedGrowthPct' ? 'desc' : 'desc'); }
	}

	function SortHeader({ label, col }: { label: string; col: typeof sort }) {
		const active = sort === col;
		return (
			<button onClick={() => onSort(col)} className={`px-4 py-3 text-left ${active ? 'text-gray-200' : ''}`}>
				{label} {active ? (direction === 'asc' ? '▲' : '▼') : ''}
			</button>
		);
	}

	return (
		<div className="card overflow-hidden">
			<div className="overflow-x-auto">
				<table className="min-w-full text-sm">
					<thead className="bg-black/20 text-gray-400">
						<tr>
							<th className="px-4 py-3 text-left">#</th>
							<th className="px-4 py-3 text-left">Name</th>
							<th className="px-4 py-3 text-right"><SortHeader label="Price" col="price" /></th>
							<th className="px-4 py-3 text-right"><SortHeader label="24h" col="priceChangePct" /></th>
							<th className="px-4 py-3 text-right"><SortHeader label="Market Cap" col="marketCap" /></th>
							<th className="px-4 py-3 text-right"><SortHeader label="Predicted 14d" col="predictedGrowthPct" /></th>
							<th className="px-4 py-3 text-left">News</th>
						</tr>
					</thead>
					<tbody>
						{stocks.map((s, idx) => (
							<tr key={s.id} className="table-row-hover">
								<td className="px-4 py-3 text-gray-400">{idx + 1}</td>
								<td className="px-4 py-3">
									<div className="flex items-center gap-3">
										<div className="h-8 w-8 rounded-full overflow-hidden bg-gray-800 border border-gray-700">
											{s.logoUrl ? (
												<img src={s.logoUrl} alt="logo" className="h-full w-full object-cover" />
											) : null}
										</div>
										<div>
											<Link href={`/stock/${s.ticker}`} className="font-medium hover:underline">{s.ticker}</Link>
											<div className="text-xs text-gray-400">{s.name}</div>
										</div>
										<Sparkline data={s.sparkline.map(v => ({ value: v }))} positive={s.predictedGrowthPct >= 0} />
									</div>
								</td>
								<td className="px-4 py-3 text-right">${s.price.toFixed(2)}</td>
								<td className={`px-4 py-3 text-right ${s.priceChangePct >= 0 ? 'text-positive' : 'text-negative'}`}>{(s.priceChangePct >= 0 ? '+' : '') + s.priceChangePct.toFixed(2)}%</td>
								<td className="px-4 py-3 text-right">{numeral(s.marketCap).format('($ 0.00 a)')}</td>
								<td className={`px-4 py-3 text-right ${s.predictedGrowthPct >= 0 ? 'text-positive' : 'text-negative'}`}>{(s.predictedGrowthPct >= 0 ? '+' : '') + s.predictedGrowthPct.toFixed(2)}%</td>
								<td className="px-4 py-3 text-left">
									<div className="flex flex-wrap gap-2">
										{s.newsHeadlines.slice(0, 3).map((h, i) => (
											<span key={i} className="px-2 py-1 rounded-full bg-black/20 text-xs text-gray-300" title={h}>{h.length > 38 ? h.slice(0, 35) + '…' : h}</span>
										))}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}