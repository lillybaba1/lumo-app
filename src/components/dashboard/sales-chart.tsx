
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface RevenueData {
  month: string;
  revenue: number;
}

interface SalesChartProps {
  currencySymbol?: string;
  revenueData?: RevenueData[];
}

export default function SalesChart({ currencySymbol = '$', revenueData = [] }: SalesChartProps) {
    // Transform revenueData to chart format
    const chartData = revenueData.map(item => ({
      name: item.month,
      total: item.revenue
    }))

  return (
     <Card>
        <CardHeader>
            <CardTitle className="font-headline">Sales Overview</CardTitle>
            <CardDescription>Monthly revenue from completed orders (last 12 months)</CardDescription>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                />
                <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${currencySymbol}${value}`}
                />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--accent))', radius: 'var(--radius)'}}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)'
                  }}
                  formatter={(value) => `${currencySymbol}${value}`}
                />
                <Bar dataKey="total" fill="hsl(262.1 83.3% 57.8%)" radius={[4, 4, 0, 0]} />
            </BarChart>
            </ResponsiveContainer>
        </CardContent>
     </Card>
  )
}
