'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card } from '@/components/ui/card'

interface CategoryData {
    categoryName: string
    categoryColor: string
    totalSpent: number
}

interface SpendingDonutChartProps {
    data: CategoryData[]
    totalSpent: number
}

export function SpendingDonutChart({ data, totalSpent }: SpendingDonutChartProps) {
    // Filter out zero-spend categories and sort by spending
    const chartData = data
        .filter(d => d.totalSpent > 0)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .map(d => ({
            name: d.categoryName,
            value: d.totalSpent,
            color: d.categoryColor,
            percent: ((d.totalSpent / totalSpent) * 100).toFixed(1)
        }))

    if (chartData.length === 0) {
        return (
            <Card className="p-6 flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No spending data to display</p>
            </Card>
        )
    }

    const formatValue = (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M Ft`
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K Ft`
        return `${value.toFixed(0)} Ft`
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-popover border rounded-lg shadow-lg px-3 py-2">
                    <p className="font-medium text-sm">{data.name}</p>
                    <p className="text-sm text-muted-foreground">
                        {formatValue(data.value)} ({data.percent}%)
                    </p>
                </div>
            )
        }
        return null
    }

    const renderLegend = (props: any) => {
        const { payload } = props
        return (
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4">
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-1.5">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs text-muted-foreground">{entry.value}</span>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <Card className="p-6 flex flex-col relative">
            <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="45%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend content={renderLegend} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pt-4">
                <div className="text-center bg-white/80 dark:bg-black/80 backdrop-blur-sm p-2 rounded-xl">
                    <p className="text-3xl font-bold tracking-tight">{formatValue(totalSpent)}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Total</p>
                </div>
            </div>
        </Card>
    )
}
