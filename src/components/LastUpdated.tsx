"use client";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function LastUpdated() {
	const { data } = useSWR<{ lastUpdated: string }>("/api/last-updated", fetcher, { refreshInterval: 60_000 });
	return (
		<div className="text-xs text-gray-400">
			Last updated: <span className="text-gray-300">{data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : '—'}</span>
		</div>
	);
}