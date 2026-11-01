import {appConfig} from '../../shared/config/app'

export class ApiError extends Error {
    readonly status: number
    readonly path: string
    readonly body: string | null

    constructor(status: number, path: string, body: string | null) {
        super(body?.trim() || `API request failed with status ${status}`)
        this.name = 'ApiError'
        this.status = status
        this.path = path
        this.body = body
    }
}

export async function apiRequest<T>(
    path: string,
    options?: RequestInit,
): Promise<T> {
    const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
        ...options,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    })

    if (!response.ok) {
        const body = await response.text().catch(() => null)
        throw new ApiError(response.status, path, body)
    }

    if (response.status === 204) {
        return undefined as T
    }

    return await response.json() as Promise<T>
}
