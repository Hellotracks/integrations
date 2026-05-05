"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeBaseUrl = normalizeBaseUrl;
exports.encodeQuery = encodeQuery;
exports.cleanObject = cleanObject;
exports.optionalInteger = optionalInteger;
exports.optionalNonNegativeInteger = optionalNonNegativeInteger;
exports.optionalNumber = optionalNumber;
exports.normalizeJobPayload = normalizeJobPayload;
exports.extractResponseData = extractResponseData;
exports.extractHttpErrorMessage = extractHttpErrorMessage;
function normalizeBaseUrl(baseUrl) {
    return (baseUrl || 'https://api.hellotracks.com/v1').replace(/\/+$/, '');
}
function encodeQuery(params) {
    const query = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
    return query ? `?${query}` : '';
}
function cleanObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return value;
    }
    const cleaned = Object.fromEntries(Object.entries(value)
        .map(([key, entry]) => [key, cleanObject(entry)])
        .filter(([, entry]) => {
        if (entry === undefined || entry === null || entry === '') {
            return false;
        }
        return !(entry && typeof entry === 'object' && !Array.isArray(entry) && Object.keys(entry).length === 0);
    }));
    return cleaned;
}
function optionalInteger(value, field, min, max) {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const parsed = typeof value === 'number' ? value : Number(String(value).trim());
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
        throw new Error(`${field} must be a number between ${min} and ${max}`);
    }
    return parsed;
}
function optionalNonNegativeInteger(value, field) {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const parsed = typeof value === 'number' ? value : Number(String(value).trim());
    if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error(`${field} must be a non-negative integer`);
    }
    return parsed;
}
function optionalNumber(value, field) {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const parsed = typeof value === 'number' ? value : Number(String(value).trim());
    if (!Number.isFinite(parsed)) {
        throw new Error(`${field} must be a number`);
    }
    return parsed;
}
function normalizeJobPayload(job) {
    const normalized = { ...job };
    if ('priority' in normalized) {
        normalized.priority = optionalInteger(normalized.priority, 'Priority', 0, 10);
    }
    if ('onSiteDurationSeconds' in normalized) {
        normalized.onSiteDurationSeconds = optionalNonNegativeInteger(normalized.onSiteDurationSeconds, 'On-site duration seconds');
    }
    if (normalized.location && typeof normalized.location === 'object' && !Array.isArray(normalized.location)) {
        const location = normalized.location;
        normalized.location = { ...location };
        if ('lat' in location) {
            normalized.location.lat = optionalNumber(location.lat, 'Location latitude');
        }
        if ('lng' in location) {
            normalized.location.lng = optionalNumber(location.lng, 'Location longitude');
        }
    }
    return normalized;
}
function extractResponseData(response) {
    if (response.error && typeof response.error === 'object') {
        const error = response.error;
        throw new Error(String(error.message || 'Hellotracks request failed'));
    }
    if (response.error) {
        throw new Error(String(response.error));
    }
    if (response.data && typeof response.data === 'object') {
        return response.data;
    }
    return response;
}
function extractHttpErrorMessage(error) {
    if (!error || typeof error !== 'object') {
        return String(error);
    }
    const candidate = error;
    const body = candidate.response?.body ?? candidate.response?.data;
    if (body && typeof body === 'object') {
        const data = body;
        if (data.error && typeof data.error === 'object') {
            const apiError = data.error;
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
