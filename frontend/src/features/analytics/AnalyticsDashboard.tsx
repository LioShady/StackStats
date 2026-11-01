import type {AnalyticsSection} from '../../shared/types/analytics'
import {useAnalytics} from './useAnalytics'

const sections: Array<{ id: AnalyticsSection; label: string }> = [
    {id: 'activity', label: 'Users activity'},
    {id: 'technologyPopularity', label: 'Technology popularity'},
    {id: 'resolvedQuestions', label: 'Resolved questions'},
]

const seriesColors = ['#5b6cf9', '#13a88a', '#f59e43', '#e56888', '#8b5cf6', '#20a6c7']

const compactNumber = new Intl.NumberFormat('ru-RU', {
    notation: 'compact',
    maximumFractionDigits: 1,
})

interface Series {
    name: string
    color: string
    values: number[]
}

function LineChart({
                       periods,
                       series,
                       showArea = false,
                   }: {
    periods: string[]
    series: Series[]
    showArea?: boolean
}) {
    const width = 820
    const height = 340
    const margin = {top: 24, right: 24, bottom: 44, left: 68}
    const plotWidth = width - margin.left - margin.right
    const plotHeight = height - margin.top - margin.bottom
    const maxValue = Math.max(...series.flatMap((item) => item.values), 0)
    const rawStep = maxValue > 0 ? maxValue / 4 : 1
    const stepMagnitude = 10 ** Math.floor(Math.log10(rawStep))
    const normalizedStep = rawStep / stepMagnitude
    const stepSize = (normalizedStep <= 1 ? 1 : normalizedStep <= 2 ? 2 : normalizedStep <= 5 ? 5 : 10) *
        stepMagnitude
    const axisMax = Math.max(stepSize * 4, 1)
    const yFor = (value: number) => margin.top + plotHeight * (1 - value / axisMax)
    const xFor = (index: number) =>
        margin.left + (periods.length < 2 ? plotWidth / 2 : (index / (periods.length - 1)) * plotWidth)
    const ticks = Array.from({length: 5}, (_, index) => (axisMax * index) / 4)

    if (!periods.length || !series.length) {
        return <div className="empty-chart">Insufficient data to generate a chart</div>
    }

    return (
        <div className="line-chart-wrap">
            <svg
                className="line-chart"
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label="Trends in indicators over the years"
            >
                {showArea && (
                    <defs>
                        <linearGradient id="activity-area" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={series[0].color} stopOpacity=".22"/>
                            <stop offset="100%" stopColor={series[0].color} stopOpacity="0"/>
                        </linearGradient>
                    </defs>
                )}
                {ticks.map((tick) => (
                    <g key={tick}>
                        <line
                            className="chart-grid-line"
                            x1={margin.left}
                            x2={width - margin.right}
                            y1={yFor(tick)}
                            y2={yFor(tick)}
                        />
                        <text className="chart-axis-label" x={margin.left - 12} y={yFor(tick) + 4} textAnchor="end">
                            {compactNumber.format(tick)}
                        </text>
                    </g>
                ))}
                {periods.map((period, index) => (
                    <g key={period}>
                        <line
                            className="chart-grid-line chart-grid-line-vertical"
                            x1={xFor(index)}
                            x2={xFor(index)}
                            y1={margin.top}
                            y2={margin.top + plotHeight}
                        />
                        <text className="chart-axis-label" x={xFor(index)} y={height - 13} textAnchor="middle">
                            {period}
                        </text>
                    </g>
                ))}
                {series.map((item, seriesIndex) => {
                    const points = item.values.map((value, index) => `${xFor(index)},${yFor(value)}`)
                    const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point}`).join(' ')
                    const areaPath = `${path} L ${xFor(item.values.length - 1)},${margin.top + plotHeight} L ${xFor(0)},${margin.top + plotHeight} Z`

                    return (
                        <g key={item.name}>
                            {showArea && seriesIndex === 0 && (
                                <path d={areaPath} fill="url(#activity-area)"/>
                            )}
                            <path className="chart-series-line" d={path} stroke={item.color}/>
                            {item.values.map((value, index) => (
                                <circle
                                    className="chart-point"
                                    key={`${item.name}-${periods[index]}`}
                                    cx={xFor(index)}
                                    cy={yFor(value)}
                                    r="4.5"
                                    fill={item.color}
                                >
                                    <title>{`${item.name}: ${compactNumber.format(value)} · ${periods[index]}`}</title>
                                </circle>
                            ))}
                        </g>
                    )
                })}
            </svg>
            <div className="chart-legend" role="list" aria-label="Legend">
                {series.map((item) => (
                    <span className="legend-item" key={item.name} role="listitem">
                        <span className="legend-dot" style={{backgroundColor: item.color}}/>
                        {item.name}
                    </span>
                ))}
            </div>
        </div>
    )
}

interface AnalyticsDashboardProps {
    activeSection: AnalyticsSection
    onSectionChange: (section: AnalyticsSection) => void
}

export function AnalyticsDashboard({
                                       activeSection,
                                       onSectionChange,
                                   }: AnalyticsDashboardProps) {
    const {data, isLoading, error} = useAnalytics(activeSection)
    const chartConfig = {
        activity: {
            title: 'Activity dynamics',
            description: 'Number of active users by year',
            insight: 'Changes in user activity',
        },
        technologyPopularity: {
            title: 'Technology popularity',
            description: 'Number of technology mentions by year',
            insight: 'Most popular technology in the latest period',
        },
        resolvedQuestions: {
            title: 'Resolved questions',
            description: 'Share of resolved questions by technology',
            insight: 'Average',
        },
    }[activeSection]

    const chartContent = () => {
        if (!data) return null

        if (activeSection === 'activity') {
            const points = data.filter((point): point is typeof point & { period: string; users: number } =>
                'users' in point,
            )
            const values = points.map((point) => point.users)
            const first = values[0] ?? 0
            const last = values[values.length - 1] ?? 0
            const change = first ? ((last - first) / first) * 100 : 0
            const peak = Math.max(...values, 0)

            return {
                type: 'line' as const,
                series: [{name: 'Active users', color: seriesColors[0], values}],
                periods: points.map((point) => point.period),
                primaryMetric: `${change > 0 ? '+' : ''}${change.toLocaleString('ru-RU', {maximumFractionDigits: 1})}%`,
                secondaryMetric: `Peak: ${compactNumber.format(peak)}`,
                showArea: true,
            }
        }

        if (activeSection === 'technologyPopularity') {
            const points = data.filter((point): point is typeof point & {
                period: string
                technology: string
                count: number
            } => 'count' in point)
            const periods = [...new Set(points.map((point) => point.period))].sort()
            const technologies = [...new Set(points.map((point) => point.technology))]
            const series = technologies.map((technology, index) => ({
                name: technology,
                color: seriesColors[index % seriesColors.length],
                values: periods.map((period) =>
                    points.find((point) => point.period === period && point.technology === technology)?.count ?? 0,
                ),
            }))
            const latestIndex = periods.length - 1
            const leader = [...series].sort((a, b) => (b.values[latestIndex] ?? 0) - (a.values[latestIndex] ?? 0))[0]

            return {
                type: 'line' as const,
                series,
                periods,
                primaryMetric: leader?.name ?? '—',
                secondaryMetric: periods.length ? `By ${periods[latestIndex]} year` : '',
                showArea: false,
            }
        }

        const points = data
            .filter((point): point is typeof point & { technology: string; percentage: number } =>
                'percentage' in point,
            )
            .sort((a, b) => b.percentage - a.percentage)
        const average = points.length
            ? points.reduce((sum, point) => sum + point.percentage, 0) / points.length
            : 0

        return {
            type: 'bars' as const,
            resolved: points,
            primaryMetric: `${average.toLocaleString('ru-RU', {maximumFractionDigits: 1})}%`,
            secondaryMetric: `${points.length} technologies`,
        }
    }

    const chart = chartContent()

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <nav className="navigation" aria-label="Analytics sections">
                    {sections.map((section, index) => (
                        <button
                            className={`navigation-button ${activeSection === section.id ? 'is-active' : ''}`}
                            key={section.id}
                            type="button"
                            aria-pressed={activeSection === section.id}
                            onClick={() => onSectionChange(section.id)}
                        >
                            <span className={`nav-icon nav-icon-${index + 1}`} aria-hidden="true"/>
                            <span>{section.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    2026
                </div>
            </aside>

            <main className="content">
                <section className="dashboard">
                    <header className="dashboard-header">
                        <h1 className="dashboard-title">
                            {sections.find((section) => section.id === activeSection)?.label}
                        </h1>
                    </header>

                    {isLoading && <div className="status">Loading data…</div>}
                    {error && !isLoading && (
                        <div className="status is-error">Failed to load data: {error}</div>
                    )}
                    {!isLoading && data && chart && (
                        <>
                            <div className="metric-card">
                                <div className="metric-label">{chartConfig.insight}</div>
                                <div className="metric-value">{chart.primaryMetric}</div>
                                <div className="metric-note">{chart.secondaryMetric}</div>
                            </div>

                            <section className="chart-card" aria-labelledby="chart-title">
                                <header className="chart-card-header">
                                    <h2 className="chart-title" id="chart-title">{chartConfig.title}</h2>
                                    <p className="chart-description">{chartConfig.description}</p>
                                </header>
                                {chart.type === 'bars' ? (
                                    <div className="horizontal-chart">
                                        <div className="percentage-axis" aria-hidden="true">
                                            <span/>
                                            <div>{[0, 25, 50, 75, 100].map((tick) => <span
                                                key={tick}>{tick}%</span>)}</div>
                                        </div>
                                        {chart.resolved.map((point, index) => (
                                            <div className="horizontal-row" key={point.technology}>
                                                <div className="horizontal-label">
                                                    <span
                                                        className="rank-number">{String(index + 1).padStart(2, '0')}</span>
                                                    {point.technology}
                                                </div>
                                                <div
                                                    className="horizontal-track"
                                                    role="img"
                                                    aria-label={`${point.technology}: ${point.percentage.toLocaleString('ru-RU')}%`}
                                                >
                                                    <div
                                                        className="horizontal-bar"
                                                        style={{
                                                            width: `${Math.min(Math.max(point.percentage, 0), 100)}%`,
                                                            backgroundColor: seriesColors[index % seriesColors.length],
                                                        }}
                                                    />
                                                </div>
                                                <span className="horizontal-value">
                                                    {point.percentage.toLocaleString('ru-RU')}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <LineChart periods={chart.periods} series={chart.series} showArea={chart.showArea}/>
                                )}
                            </section>
                        </>
                    )}
                </section>
            </main>
        </div>
    )
}
