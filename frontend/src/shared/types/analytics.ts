export interface ActivityDataPoint {
    period: string
    users: number
}

export interface TechnologyPopularityDataPoint {
    period: string
    technology: string
    count: number
}

export interface ResolvedQuestionsDataPoint {
    technology: string
    percentage: number
}

export interface AnalyticsData {
    activity: ActivityDataPoint[]
    technologyPopularity: TechnologyPopularityDataPoint[]
    resolvedQuestions: ResolvedQuestionsDataPoint[]
}

export type AnalyticsSection = keyof AnalyticsData
