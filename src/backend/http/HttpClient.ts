import {CancelToken} from "axios";

export interface HttpClient {

    baseUrl: string

    get<RESPONSE>(path: string, cancelToken?: any): Promise<RESPONSE>

    post<REQUEST, RESPONSE>(path: string, data?: REQUEST, cancelToken?: CancelToken): Promise<RESPONSE>

    put<REQUEST, RESPONSE>(path: string, data?: REQUEST, cancelToken?: CancelToken): Promise<RESPONSE>

    delete<RESPONSE>(path: string, cancelToken?: CancelToken): Promise<RESPONSE>

}