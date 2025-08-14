"use client";
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function Sparkline({ data, positive }: { data: { value: number }[]; positive: boolean }) {
	return (
		<div className="h-8 w-24">
			<ResponsiveContainer>
				<LineChart data={data} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
					<Line type="monotone" dataKey="value" stroke={positive ? '#10b981' : '#ef4444'} dot={false} strokeWidth={2} />
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}