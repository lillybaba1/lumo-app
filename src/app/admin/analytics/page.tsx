
import SalesChart from "@/components/dashboard/sales-chart";
import { getSettings } from "../settings/actions";
import RecentOrdersTable from "@/components/dashboard/recent-orders-table";

function getCurrencySymbol(currencyCode: string | undefined) {
    if (!currencyCode) return '$';
    if (currencyCode === 'GMD') return 'D';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).formatToParts(1).find(p => p.type === 'currency')?.value || '$';
}

export default async function AnalyticsPage() {
    const settings = await getSettings();
    const currencySymbol = getCurrencySymbol(settings?.currency);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-headline font-bold">Analytics</h1>
            </div>
            <div className="grid grid-cols-1 gap-6">
                <SalesChart currencySymbol={currencySymbol} />
                <RecentOrdersTable />
            </div>
        </div>
    )
}
