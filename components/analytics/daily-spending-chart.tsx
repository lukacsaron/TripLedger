'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card } from '@/components/ui/card'
import { format, parseISO, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns'

interface Expense {
    date: string
    amountHuf: number | string
    category?: {
        color: string
    }
}

interface DailySpendingChartProps {
    expenses: Expense[]
    startDate: string
    endDate?: string | null
}

export function DailySpendingChart({ expenses, startDate, endDate }: DailySpendingChartProps) {
    // Get date range
    const start = startOfDay(parseISO(startDate))
    const end = endDate ? endOfDay(parseISO(endDate)) : endOfDay(new Date())

    // Get all days in the range
    const days = eachDayOfInterval({ start, end })

    // Aggregate spending by day
    const dailyData = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd')
        const dayExpenses = expenses.filter(e =>
            format(parseISO(e.date), 'yyyy-MM-dd') === dayStr
        )
        const total = dayExpenses.reduce((sum, e) => sum + Number(e.amountHuf), 0)

        return {
            date: dayStr,
            displayDate: format(day, 'MMM d'),
            shortDate: format(day, 'MMM d'),
            total,
            count: dayExpenses.length
        }
    })

    // Only show last 14 days if more than 14 days
    const displayData = dailyData.length > 14
        ? dailyData.slice(-14)
        : dailyData

    if (displayData.length === 0 || displayData.every(d => d.total === 0)) {
        return (
            <Card className="p-6 flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No spending data to display</p>
            </Card>
        )
    }

    const maxSpend = Math.max(...displayData.map(d => d.total))

    const formatValue = (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
        return value.toFixed(0)
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-popover border rounded-lg shadow-lg px-3 py-2">
                    <p className="font-medium text-sm">{data.displayDate}</p>
                    <p className="text-sm">
                        <span className="text-muted-foreground">Spent: </span>
                        <span className="font-medium">{formatValue(data.total)} Ft</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {data.count} transaction{data.count !== 1 ? 's' : ''}
                    </p>
                </div>
            )
        }
        return null
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Daily Spending</h3>
                {dailyData.length > 14 && (
                    <span className="text-xs text-muted-foreground">Last 14 days shown</span>
                )}
            </div>
            <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                        <XAxis
                            dataKey="shortDate"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={formatValue}
                            width={45}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'hsl(var(--muted)/0.2)', radius: 8 }}
                        />
                        <Bar
                            dataKey="total"
                            radius={[6, 6, 6, 6]}
                            maxBarSize={50}
                        >
                            {displayData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.total === maxSpend
                                        ? '#3b82f6' // Blue-500 for max
                                        : '#cbd5e1' // Slate-300 for others
                                    }
                                    className="dark:opacity-80 transition-all hover:opacity-100"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}
