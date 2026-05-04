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

export function optionalInteger(value: unknown, field: string, min: number, max: number): number | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	const parsed = typeof value === 'number' ? value : Number(String(value).trim());
	if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
		throw new Error(`${field} must be a number between ${min} and ${max}`);
	}
	return parsed;
}

export function optionalNonNegativeInteger(value: unknown, field: string): number | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	const parsed = typeof value === 'number' ? value : Number(String(value).trim());
	if (!Number.isInteger(parsed) || parsed < 0) {
		throw new Error(`${field} must be a non-negative integer`);
	}
	return parsed;
}

export function optionalNumber(value: unknown, field: string): number | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	const parsed = typeof value === 'number' ? value : Number(String(value).trim());
	if (!Number.isFinite(parsed)) {
		throw new Error(`${field} must be a number`);
	}
	return parsed;
}

export function normalizeJobPayload(job: IDataObject): IDataObject {
	const normalized: IDataObject = { ...job };
	if ('priority' in normalized) {
		normalized.priority = optionalInteger(normalized.priority, 'Priority', 0, 10);
	}
	if ('onSiteDurationSeconds' in normalized) {
		normalized.onSiteDurationSeconds = optionalNonNegativeInteger(normalized.onSiteDurationSeconds, 'On-site duration seconds');
	}
	if (normalized.location && typeof normalized.location === 'object' && !Array.isArray(normalized.location)) {
		const location = normalized.location as IDataObject;
		normalized.location = { ...location };
		if ('lat' in location) {
			(normalized.location as IDataObject).lat = optionalNumber(location.lat, 'Location latitude');
		}
		if ('lng' in location) {
			(normalized.location as IDataObject).lng = optionalNumber(location.lng, 'Location longitude');
		}
	}
	return normalized;
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

export function extractHttpErrorMessage(error: unknown): string {
	if (!error || typeof error !== 'object') {
		return String(error);
	}
	const candidate = error as {
		message?: string;
		description?: string;
		response?: { body?: unknown; data?: unknown; statusCode?: number; status?: number };
	};
	const body = candidate.response?.body ?? candidate.response?.data;
	if (body && typeof body === 'object') {
		const data = body as IDataObject;
		if (data.error && typeof data.error === 'object') {
			const apiError = data.error as IDataObject;
			return String(apiError.message || JSON.stringify(data));
		}
		if (data.message) {
			return String(data.message);
		}
		return JSON.stringify(data);
	}
	if (typeof body === 'string' && body.trim()) {
		return body;
	}
	return candidate.description || candidate.message || String(error);
}
