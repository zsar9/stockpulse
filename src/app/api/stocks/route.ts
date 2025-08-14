import { NextResponse } from 'next/server';
import { getStocks } from '@/server/db';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const limit = Number(searchParams.get('limit') ?? '200');
	const sort = (searchParams.get('sort') ?? 'predictedGrowthPct').toString();
	const dirParam = (searchParams.get('direction') ?? 'desc').toString().toLowerCase();
	const direction: 'asc' | 'desc' = dirParam === 'asc' ? 'asc' : 'desc';
	const stocks = await getStocks({ limit, sort, direction });
	return NextResponse.json({ stocks });
}