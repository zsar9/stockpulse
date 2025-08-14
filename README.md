# StockPulse

A CoinMarketCap-style dashboard for short-term stock movers predicted to increase within 14 days, augmented by recent U.S. Senator trading activity.

## Tech
- Next.js (App Router) + TypeScript
- TailwindCSS
- SQLite via better-sqlite3
- Recharts for sparklines and charts
- Node cron for daily ingestion

## Environment
Copy `.env.example` to `.env` and set keys:

```
ALPHA_VANTAGE_API_KEY=YOUR_ALPHA_VANTAGE_API_KEY_HERE
FINNHUB_API_KEY=YOUR_FINNHUB_API_KEY_HERE
SENATE_STOCK_WATCHER_API=https://senatestockwatcher.com/api
```

Free tiers have rate limits. The ingestion code includes basic throttling. Consider running locally with a small universe.

## Install

```
npm install
```

## Develop

```
npm run dev
```

In another terminal, you can trigger ingestion once to populate data:

```
RUN_ONCE=1 npm run cron
```

Or schedule the cron runner (13:00 UTC daily):

```
npm run cron
```

## Notes
- Filtering avoids large caps unless predicted 14d growth > 10% or there is a senator purchase within 7 days.
- Predicted growth uses a simple momentum/RSI blend and is not financial advice.
- News tooltips and headlines sourced from Finnhub company-news.
- Logos and profiles use Finnhub profile endpoint.

## License
MIT