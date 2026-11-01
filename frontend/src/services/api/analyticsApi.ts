import {apiRequest} from './client'
import type {AnalyticsData, AnalyticsSection} from '../../shared/types/analytics'

/**
 * GET /api/analytics/activity
 * GET /api/analytics/technology-popularity
 * GET /api/analytics/resolved-questions
 */
const SECTION_PATH: Record<AnalyticsSection, string> = {
    activity: 'activity',
    technologyPopularity: 'technology-popularity',
    resolvedQuestions: 'resolved-questions',
}

export function getAnalyticsPath(section: AnalyticsSection): string {
    return `/analytics/${SECTION_PATH[section]}`
}

export function getAnalytics<TSection extends AnalyticsSection>(
    section: TSection,
    options?: {signal?: AbortSignal},
): Promise<AnalyticsData[TSection]> {
    return apiRequest<AnalyticsData[TSection]>(getAnalyticsPath(section), {
        method: 'GET',
        signal: options?.signal,
    })
}
