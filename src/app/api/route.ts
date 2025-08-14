import { NextResponse } from 'next/server';

export async function GET() {
	return NextResponse.json({ endpoints: ['/api/stocks', '/api/stock/[ticker]', '/api/last-updated', '/api/health'] });
}