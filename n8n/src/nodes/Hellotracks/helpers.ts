import type { IDataObject } from 'n8n-workflow';

export type HellotracksCredentials = {
	apiKey: string;
	apiBaseUrl: string;
};

export function normalizeBaseUrl(baseUrl: string): string {
	return (baseUrl || 'https://api.hellotracks.com/v1').replace(/\/+$/, '');
}

export function encodeQuery(params: IDataObject): string {
	const query = Object.entries(params)
		.filter(([, value]) => value !== undefined && value !== null && value !== '')
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
		.join('&');
	return query ? `?${query}` : '';
}

export function cleanObject<T>(value: T): T {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return value;
	}
	const cleaned = Object.fromEntries(
		Object.entries(value as IDataObject)
			.map(([key, entry]) => [key, cleanObject(entry)])
			.filter(([, entry]) => {
				if (entry === undefined || entry === null || entry === '') {
					return false;
				}
				return !(entry && typeof entry === 'object' && !Array.isArray(entry) && Object.keys(entry).length === 0);
			}),
	);
	return cleaned as T;
}

export function extractResponseData(response: IDataObject): IDataObject {
	if (response.error && typeof response.error === 'object') {
		const error = response.error as IDataObject;
		throw new Error(String(error.message || 'Hellotracks request failed'));
	}
	if (response.error) {
		throw new Error(String(response.error));
	}
	if (response.data && typeof response.data === 'object') {
		return response.data as IDataObject;
	}
	return response;
}
