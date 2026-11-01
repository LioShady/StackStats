import {useEffect, useState} from 'react'
import {getAnalytics} from '../../services/api/analyticsApi'
import {ApiError} from '../../services/api/client'
import type {AnalyticsData, AnalyticsSection} from '../../shared/types/analytics'

function errorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.status === 404) {
            return `endpoint ${error.path} has not yet been implemented on the backend`
        }
        return error.message
    }
    if (error instanceof Error) {
        return error.message
    }
    return 'Unknown error'
}

export function useAnalytics<TSection extends AnalyticsSection>(section: TSection) {
    const [data, setData] = useState<AnalyticsData[TSection] | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        let cancelled = false

        setIsLoading(true)
        setError(null)
        setData(null)

        getAnalytics(section, {signal: controller.signal})
            .then((payload) => {
                if (cancelled) return
                setData(payload)
                setError(null)
            })
            .catch((err: unknown) => {
                if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) {
                    return
                }
                setData(null)
                setError(errorMessage(err))
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false)
            })

        return () => {
            cancelled = true
            controller.abort()
        }
    }, [section])

    return {
        section,
        data,
        isLoading,
        error,
    }
}
