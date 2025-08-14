import StocksTable from '../components/StocksTable';
import LastUpdated from '../components/LastUpdated';

export default function HomePage() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h2 className="text-lg font-semibold">Predicted Movers (14-Day)</h2>
					<p className="text-sm text-gray-400">Filtered by growth potential and recent senator activity. Click column headers to sort.</p>
				</div>
				<LastUpdated />
			</div>
			<StocksTable />
		</div>
	);
}