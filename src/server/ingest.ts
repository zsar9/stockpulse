import { upsertStock, setMetaLastUpdated, purgeOldStocks } from './db.ts';
import dotenv from 'dotenv';
dotenv.config();
console.log('Demo mode:', process.env.ALPHA_VANTAGE_API_KEY?.includes('YOUR_'));


const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'YOUR_ALPHA_VANTAGE_API_KEY_HERE';
const FINNHUB_KEY = process.env.FINNHUB_API_KEY || 'YOUR_FINNHUB_API_KEY_HERE';
const SENATE_API = process.env.SENATE_STOCK_WATCHER_API || 'https://senatestockwatcher.com/api';

const isDemo = ALPHA_VANTAGE_KEY.includes('YOUR_') || FINNHUB_KEY.includes('YOUR_');

// Basic util: sleep
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

// Fetch helper with retries
async function fetchJson(url: string) {
	for (let i = 0; i < 3; i++) {
		try {
			const res = await fetch(url, { headers: { 'User-Agent': 'StockPulse/1.0' } });
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return await res.json();
		} catch (e) {
			await wait(500 * (i + 1));
		}
	}
	throw new Error(`Failed to fetch ${url}`);
}

// Identify candidates using senator trades and recent movers
async function getRecentSenatorBuys(): Promise<string[]> {
	if (isDemo) return ['PLTR', 'SOFI', 'IONQ'];
	try {
		const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
		const url = `${SENATE_API}/trades?from=${since}`;
		const json = await fetchJson(url);
		const tickers = new Set<string>();
		for (const t of json?.trades ?? []) {
			if (t?.type?.toLowerCase?.() === 'purchase' && t?.ticker) tickers.add(String(t.ticker).toUpperCase());
		}
		return Array.from(tickers);
	} catch {
		return [];
	}
}

// Fetch OHLC daily from Alpha Vantage (free tier)
async function getDailySeries(ticker: string): Promise<{ t: string; c: number }[]> {
	if (isDemo) {
		const dates: { t: string; c: number }[] = [];
		let price = 10 + Math.random() * 40;
		for (let d = 60; d >= 0; d--) {
			const day = new Date(Date.now() - d * 24 * 3600 * 1000);
			// upward bias to create >10% predicted in demo
			price *= 1 + (Math.random() - 0.3) * 0.02;
			dates.push({ t: day.toISOString().slice(0, 10), c: Number(price.toFixed(2)) });
		}
		return dates;
	}
	const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${encodeURIComponent(ticker)}&apikey=${ALPHA_VANTAGE_KEY}`;
	const json = await fetchJson(url);
	const series = json['Time Series (Daily)'] || {};
	const entries = Object.entries(series).map(([date, v]: any) => ({ t: date, c: Number(v['5. adjusted close']) }))
		.sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
	return entries.slice(-120);
}

// Price, marketcap, and logo via Finnhub
async function getFinnhubQuoteProfile(ticker: string): Promise<{ price: number; changePct: number; marketCap: number; logoUrl?: string; name: string }> {
	if (isDemo) {
		return { price: 20 + Math.random() * 80, changePct: (Math.random() - 0.5) * 5, marketCap: 5_000_000_000 + Math.random() * 8_000_000_000, logoUrl: undefined, name: ticker };
	}
	const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${FINNHUB_KEY}`;
	const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(ticker)}&token=${FINNHUB_KEY}`;
	const [quote, profile] = await Promise.all([fetchJson(quoteUrl), fetchJson(profileUrl)]);
	const price = Number(quote.c || 0);
	const prevClose = Number(quote.pc || 0);
	const changePct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
	const marketCap = Number(profile.marketCapitalization || 0) * 1_000_000; // Finnhub in USD billions sometimes
	return { price, changePct, marketCap, logoUrl: profile.logo || undefined, name: profile.name || ticker };
}

// Simple momentum-based predicted growth over 14 days
function predict14DayGrowth(series: { t: string; c: number }[]): number {
	if (series.length < 20) return 0;
	const closes = series.map(s => s.c);
	const n7 = closes.slice(-7);
	const n14 = closes.slice(-14);
	const mom7 = (n7[n7.length - 1] - n7[0]) / n7[0];
	const mom14 = (n14[n14.length - 1] - n14[0]) / n14[0];
	const rsi = computeRSI(closes, 14);
	const score = 0.6 * mom7 + 0.4 * mom14 + 0.0005 * (rsi - 50);
	return Math.max(-0.3, Math.min(0.3, score)) * 100; // clamp +/-30%
}

function computeRSI(closes: number[], period: number): number {
	if (closes.length <= period) return 50;
	let gains = 0, losses = 0;
	for (let i = closes.length - period; i < closes.length; i++) {
		const delta = closes[i] - closes[i - 1];
		if (delta >= 0) gains += delta; else losses -= delta;
	}
	const avgGain = gains / period;
	const avgLoss = losses / period;
	if (avgLoss === 0) return 70;
	const rs = avgGain / avgLoss;
	return 100 - 100 / (1 + rs);
}

// News via Finnhub
async function getNews(ticker: string) {
	if (isDemo) {
		return [
			{ headline: `${ticker} demo headline one`, url: 'https://example.com', time: new Date().toISOString() },
			{ headline: `${ticker} demo headline two`, url: 'https://example.com', time: new Date(Date.now() - 3600_000).toISOString() }
		];
	}
	const to = new Date().toISOString().slice(0, 10);
	const from = new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().slice(0, 10);
	const url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(ticker)}&from=${from}&to=${to}&token=${FINNHUB_KEY}`;
	const json = await fetchJson(url);
	return (json as any[]).slice(0, 20).map(n => ({ headline: n.headline, url: n.url, time: new Date(n.datetime * 1000).toISOString() }));
}

export async function runIngestion() {
	const senatorBuys = await getRecentSenatorBuys();
	// Universe
	const universe = Array.from(new Set<string>([...senatorBuys, 'PLTR', 'IONQ', 'SOFI', 'NVDA', 'SMCI', 'ARM', 'CELH']));
	for (const ticker of universe) {
		try {
			const [series, profile, news] = await Promise.all([
				getDailySeries(ticker),
				getFinnhubQuoteProfile(ticker),
				getNews(ticker)
			]);
			if (series.length === 0) continue;
			const predicted = predict14DayGrowth(series);
			// Strict filtering: include only if predicted > 10% OR senator purchased in last 7 days
			const allow = predicted > 10 || senatorBuys.includes(ticker);
			if (!allow) continue;
			const sparkline = series.slice(-7).map(s => s.c);
			await upsertStock({
				id: ticker,
				ticker,
				name: profile.name,
				logoUrl: profile.logoUrl,
				price: profile.price,
				priceChangePct: profile.changePct,
				marketCap: profile.marketCap,
				predictedGrowthPct: predicted,
				sparkline,
				chart: series,
				news
			});
			await wait(isDemo ? 50 : 1200);
		} catch (e) {
			continue;
		}
	}
	await setMetaLastUpdated(new Date().toISOString());
	await purgeOldStocks();
}
