import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse, CancelToken, InternalAxiosRequestConfig} from 'axios'
import {HttpClient} from './HttpClient'
import {requestLogger} from "axios-logger";

export class AxiosHttpClient implements HttpClient {
    axiosInstance: AxiosInstance
    baseUrl: string
    defaultTimeout: number

    constructor(baseUrl: string, defaultTimeout?: number) {
        this.baseUrl = baseUrl
        this.axiosInstance = axios.create()
        this.defaultTimeout = defaultTimeout ?? 10000
        this.axiosInstance.interceptors.request.use((request: InternalAxiosRequestConfig) => {
            requestLogger(request)
            return request;
        });
    }

    makeUrl(path: string): string {
        return !!path ? `${this.baseUrl}/${path}` : this.baseUrl
    }

    // private static makeAuthHeader(authCtx?: AuthContext): object {
    //     const token = AxiosHttpClient.getTokenOrFetchFromCookies(authCtx)
    //     return !!token ? {
    //         Authorization: token
    //     } : {}
    // }

    /**
     * Retrieves the auth token from the AuthCtx if it is passed in, ELSE
     * it tries to fetch it from the cookies IF the code is executed browser-side
     */
    // private static getTokenOrFetchFromCookies(authCtx?: AuthContext): string | undefined {
    //     const tokenExists = !!authCtx?.token
    //     const isBrowserSide = typeof window !== 'undefined'
    //
    //     if (tokenExists) {
    //         return authCtx?.token
    //     } else if (isBrowserSide) {
    //         LoggingUtils.logInfo(`No auth ctx - fetching locally`)
    //         return ClientAuthUtils.authCtxFromCookies()?.token
    //     } else {
    //         LoggingUtils.logWarn(`No auth token found`)
    //         return undefined
    //     }
    // }

    get<RESPONSE>(path: string, cancelToken?: CancelToken): Promise<RESPONSE> {
        const request = this.axiosInstance.get<RESPONSE>(this.makeUrl(path), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json, text/plain, */*',
                // ...AxiosHttpClient.makeAuthHeader(authCtx)
            },
            timeout: this.defaultTimeout,
            cancelToken
        } as AxiosRequestConfig)
        return this.finishRequest<RESPONSE>(request)
    }

    post<REQUEST, RESPONSE>(path: string, data?: REQUEST, cancelToken?: CancelToken): Promise<RESPONSE> {
        const request = this.axiosInstance.post<RESPONSE>(this.makeUrl(path), data, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json, text/plain, */*',
                // ...AxiosHttpClient.makeAuthHeader(authCtx)
            },
            timeout: this.defaultTimeout,
            cancelToken
        } as AxiosRequestConfig)
        return this.finishRequest<RESPONSE>(request)
    }

    put<REQUEST, RESPONSE>(path: string, data?: REQUEST, cancelToken?: CancelToken): Promise<RESPONSE> {
        const request = this.axiosInstance.put<RESPONSE>(this.makeUrl(path), data, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json, text/plain, */*',
                // ...AxiosHttpClient.makeAuthHeader(authCtx)
            },
            timeout: this.defaultTimeout,
            cancelToken,
        } as AxiosRequestConfig)
        return this.finishRequest<RESPONSE>(request)
    }

    delete<RESPONSE>(path: string, cancelToken?: CancelToken): Promise<RESPONSE> {
        const request = this.axiosInstance.delete<RESPONSE>(this.makeUrl(path), {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json, text/plain, */*',
                // ...AxiosHttpClient.makeAuthHeader(authCtx)
            },
            timeout: this.defaultTimeout,
            cancelToken
        } as AxiosRequestConfig)
        return this.finishRequest<RESPONSE>(request)
    }

    private finishRequest<RESPONSE>(request: Promise<AxiosResponse<RESPONSE>>): Promise<RESPONSE> {
        return request
            .then((response) => {
                const status = response.status
                const statusIs2xx = (200 <= status && status < 299)
                if (statusIs2xx) {
                    return Promise.resolve(response.data)
                } else {
                    return Promise.reject(response.data as string)
                }
            })
            .catch((error) => {
                if (error?.response) {
                    return Promise.reject(error.response?.data ?? error.toString())
                } else {
                    return Promise.reject(error.toString())
                }
            })
    }
}