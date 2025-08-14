import { NextResponse } from 'next/server';
import { getStockDetail } from '@/server/db';

export async function GET(_request: Request, { params }: { params: { ticker: string } }) {
	const detail = await getStockDetail(params.ticker.toUpperCase());
	if (!detail) return new NextResponse('Not found', { status: 404 });
	return NextResponse.json(detail);
}