import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'StockPulse',
	description: 'Short-term stock momentum and senator trading tracker'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark">
			<body className="bg-background text-gray-200">
				<div className="min-h-screen">
					<header className="border-b border-gray-800 sticky top-0 bg-background/80 backdrop-blur z-20">
						<div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
							<h1 className="text-xl font-bold tracking-tight"><span className="text-accent">Stock</span>Pulse</h1>
							<div className="text-xs text-gray-400">Built with Next.js</div>
						</div>
					</header>
					<main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
					<footer className="mx-auto max-w-7xl px-4 py-8 text-xs text-gray-500">
						Data from public APIs. Not financial advice.
					</footer>
				</div>
			</body>
		</html>
	);
}