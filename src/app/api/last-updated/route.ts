import { NextResponse } from 'next/server';
import { getMetaLastUpdated } from '@/server/db';

export async function GET() {
	try {
		const lastUpdated = await getMetaLastUpdated();
		return NextResponse.json({ lastUpdated: lastUpdated ?? null });
	} catch (e) {
		return NextResponse.json({ lastUpdated: null });
	}
}