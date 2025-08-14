import Database from 'better-sqlite3';
import { join } from 'path';

const db = new Database(join(process.cwd(), 'data.sqlite'));

db.pragma('journal_mode = WAL');

db.exec(`CREATE TABLE IF NOT EXISTS stocks (
	id TEXT PRIMARY KEY,
	ticker TEXT NOT NULL,
	name TEXT NOT NULL,
	logoUrl TEXT,
	price REAL NOT NULL,
	priceChangePct REAL NOT NULL,
	marketCap REAL NOT NULL,
	predictedGrowthPct REAL NOT NULL,
	sparkline TEXT NOT NULL,
	updatedAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS stock_news (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	stockId TEXT NOT NULL,
	headline TEXT NOT NULL,
	url TEXT NOT NULL,
	time TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS stock_detail_chart (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	stockId TEXT NOT NULL,
	t TEXT NOT NULL,
	c REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS meta (
	key TEXT PRIMARY KEY,
	value TEXT
);
`);

export async function getMetaLastUpdated(): Promise<string | null> {
	const row = db.prepare('SELECT value FROM meta WHERE key = ?').get('lastUpdated') as { value?: string } | undefined;
	return row?.value ?? null;
}

export async function setMetaLastUpdated(iso: string): Promise<void> {
	db.prepare('INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run('lastUpdated', iso);
}

export type GetStocksOptions = { limit?: number; sort?: string; direction?: 'asc' | 'desc' };

const SORTABLE_COLUMNS = new Set(['predictedGrowthPct', 'marketCap', 'price', 'priceChangePct']);

export async function getStocks({ limit = 200, sort = 'predictedGrowthPct', direction = 'desc' }: GetStocksOptions) {
	const sortCol = SORTABLE_COLUMNS.has(sort) ? sort : 'predictedGrowthPct';
	const dir = direction === 'asc' ? 'ASC' : 'DESC';
	const rows = db.prepare(`SELECT * FROM stocks ORDER BY ${sortCol} ${dir} LIMIT ?`).all(limit) as any[];
	return rows.map(r => ({
		id: r.id,
		ticker: r.ticker,
		name: r.name,
		logoUrl: r.logoUrl || undefined,
		price: r.price,
		priceChangePct: r.priceChangePct,
		marketCap: r.marketCap,
		predictedGrowthPct: r.predictedGrowthPct,
		newsHeadlines: (db.prepare('SELECT headline FROM stock_news WHERE stockId = ? ORDER BY time DESC LIMIT 3').all(r.id) as any[]).map(n => n.headline),
		sparkline: JSON.parse(r.sparkline) as number[]
	}));
}

export async function getStockDetail(ticker: string) {
	const row = db.prepare('SELECT * FROM stocks WHERE ticker = ?').get(ticker) as any;
	if (!row) return null;
	const chart = db.prepare('SELECT t, c FROM stock_detail_chart WHERE stockId = ? ORDER BY t ASC').all(row.id) as any[];
	const news = db.prepare('SELECT headline, url, time FROM stock_news WHERE stockId = ? ORDER BY time DESC LIMIT 20').all(row.id) as any[];
	return {
		id: row.id,
		ticker: row.ticker,
		name: row.name,
		logoUrl: row.logoUrl || undefined,
		price: row.price,
		priceChangePct: row.priceChangePct,
		marketCap: row.marketCap,
		predictedGrowthPct: row.predictedGrowthPct,
		chart,
		news
	};
}

export type UpsertStockInput = {
	id: string;
	ticker: string;
	name: string;
	logoUrl?: string;
	price: number;
	priceChangePct: number;
	marketCap: number;
	predictedGrowthPct: number;
	sparkline: number[];
	chart: { t: string; c: number }[];
	news: { headline: string; url: string; time: string }[];
};

export async function upsertStock(input: UpsertStockInput) {
	db.prepare(`INSERT INTO stocks(id, ticker, name, logoUrl, price, priceChangePct, marketCap, predictedGrowthPct, sparkline, updatedAt)
		VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET ticker=excluded.ticker, name=excluded.name, logoUrl=excluded.logoUrl, price=excluded.price, priceChangePct=excluded.priceChangePct, marketCap=excluded.marketCap, predictedGrowthPct=excluded.predictedGrowthPct, sparkline=excluded.sparkline, updatedAt=excluded.updatedAt
	`).run(
		input.id,
		input.ticker,
		input.name,
		input.logoUrl ?? null,
		input.price,
		input.priceChangePct,
		input.marketCap,
		input.predictedGrowthPct,
		JSON.stringify(input.sparkline),
		new Date().toISOString()
	);
	// replace chart
	db.prepare('DELETE FROM stock_detail_chart WHERE stockId = ?').run(input.id);
	const chartInsert = db.prepare('INSERT INTO stock_detail_chart(stockId, t, c) VALUES(?, ?, ?)');
	const insertMany = db.transaction((rows: { t: string; c: number }[]) => {
		for (const r of rows) chartInsert.run(input.id, r.t, r.c);
	});
	insertMany(input.chart);
	// replace news
	db.prepare('DELETE FROM stock_news WHERE stockId = ?').run(input.id);
	const newsInsert = db.prepare('INSERT INTO stock_news(stockId, headline, url, time) VALUES(?, ?, ?, ?)');
	const insertNews = db.transaction((rows: { headline: string; url: string; time: string }[]) => {
		for (const n of rows) newsInsert.run(input.id, n.headline, n.url, n.time);
	});
	insertNews(input.news);
}

export async function purgeOldStocks() {
	db.prepare("DELETE FROM stocks WHERE datetime(updatedAt) < datetime('now', '-2 days')").run();
}