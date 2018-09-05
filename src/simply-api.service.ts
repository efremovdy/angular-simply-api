import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Inject, Injectable, Optional } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WebApiHttpParams } from '../src/web-api-http-params';
import { ISerializer } from './simply-api.options';
import { API_ENDPOINT, API_SERIALIZER } from './simply-api.tokens';


export enum ResponseTypeEnum {
    json = 'json',
    text = 'text',
    arraybuffer = 'arraybuffer',
    blob = 'blob'
}

export interface IApiOptions  {
    headers?: HttpHeaders;
    params?: { [key: string]: any };
    responseType?: ResponseTypeEnum;
}

export interface IDeserializeOptions {
    deserializeTo?: { new(): any };
}

@Injectable()
export class SimplyApiService {
    constructor(
        private http: HttpClient,
        @Optional()
        @Inject(API_ENDPOINT)
        private apiEndpoint: string = null,
        @Optional()
        @Inject(API_SERIALIZER)
        private serializer: ISerializer
    ) {}

    public get<T>(url: string, options?: IApiOptions & IDeserializeOptions): Observable<T> {
        options = options || { responseType: ResponseTypeEnum.json };
        const par = this.getHttpParams(options.params);
        return this.http
            .get<T>(this.buildUrl(url), {
                params: par,
                responseType: options.responseType as ResponseTypeEnum.json,
                headers: options.headers
            })
            .pipe(map(result => this.tryDeserialize<T>(result, options && options.deserializeTo)));
    }

    public post<T>(url: string, body: any, options?: IApiOptions & IDeserializeOptions): Observable<T> {
        options = options || { responseType: ResponseTypeEnum.json };
        const par = this.getHttpParams(options.params);
        return this.http
            .post<T>(this.buildUrl(url), this.trySerialize(body), {
                params: par,
                responseType: options.responseType as ResponseTypeEnum.json,
                headers: options.headers
            })
            .pipe(map(result => this.tryDeserialize<T>(result, options && options.deserializeTo)));
    }

    public put<T>(url: string, body: any, options?: IApiOptions & IDeserializeOptions): Observable<T> {
        options = options || { responseType: ResponseTypeEnum.json };
        const par = this.getHttpParams(options.params);
        return this.http
            .put<T>(this.buildUrl(url), this.trySerialize(body), {
                params: par,
                responseType: options.responseType as ResponseTypeEnum.json,
                headers: options.headers
            })
            .pipe(map(result => this.tryDeserialize<T>(result, options && options.deserializeTo)));
    }

    public delete<T>(url: string, options?: IApiOptions & IDeserializeOptions): Observable<T> {
        options = options || { responseType: ResponseTypeEnum.json };
        const par = this.getHttpParams(options.params);
        return this.http
            .delete<T>(this.buildUrl(url), {
                params: par,
                responseType: options.responseType as ResponseTypeEnum.json,
                headers: options.headers
            })
            .pipe(map(result => this.tryDeserialize<T>(result, options && options.deserializeTo)));
    }

    public buildUrl(url: string) {
        if ((url && url.startsWith('http')) || !this.apiEndpoint) {
            return url;
        }
        return this.apiEndpoint.concat(url);
    }

    private getHttpParams(params: { [key: string]: any }): HttpParams {
        if (!params) {
            return null;
        }
        return new WebApiHttpParams({ fromObject: this.trySerialize(params) });
    }

    private trySerialize(data: any): any {
        if (this.serializer) {
            return this.serializer.serialize(data);
        }
        return data;
    }

    private tryDeserialize<T>(data: any, deserializeTo: { new(): T }): T {
        if (this.serializer && typeof deserializeTo === 'function') {
            return this.serializer.deserialize(data, deserializeTo);
        }
        return data;
    }
}
