import type { IDataObject } from 'n8n-workflow';
export type HellotracksCredentials = {
    apiKey: string;
    apiBaseUrl?: string;
};
export declare function normalizeBaseUrl(baseUrl?: string): string;
export declare function encodeQuery(params: IDataObject): string;
export declare function cleanObject<T>(value: T): T;
export declare function optionalInteger(value: unknown, field: string, min: number, max: number): number | undefined;
export declare function optionalNonNegativeInteger(value: unknown, field: string): number | undefined;
export declare function optionalNumber(value: unknown, field: string): number | undefined;
export declare function normalizeJobPayload(job: IDataObject): IDataObject;
export declare function extractResponseData(response: IDataObject): IDataObject;
export declare function extractHttpErrorMessage(error: unknown): string;
