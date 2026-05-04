"use strict";

const DEFAULT_API_BASE = "https://api.hellotracks.com/api/public/v1";

function normalizeBaseUrl(baseUrl) {
  return (baseUrl || DEFAULT_API_BASE).replace(/\/+$/, "");
}

function cleanObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined && entry !== null && entry !== "")
      .map(([key, entry]) => [key, cleanObject(entry)])
  );
}

async function hellotracksRequest(fetchImpl, auth, method, path, body) {
  const apiKey = auth && auth.apiKey;
  if (!apiKey) {
    throw new Error("Missing Hellotracks API key");
  }
  const baseUrl = normalizeBaseUrl(auth.apiBaseUrl);
  const response = await fetchImpl(`${baseUrl}${path}`, {
    method,
    headers: {
      "API-Key": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: body ? JSON.stringify(cleanObject(body)) : undefined
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok || payload.error) {
    const message = payload.error && payload.error.message ? payload.error.message : `Hellotracks request failed: ${response.status}`;
    throw new Error(message);
  }
  return payload.data || payload;
}

function encodeQuery(params) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }
  const text = query.toString();
  return text ? `?${text}` : "";
}

async function testAuth(fetchImpl, auth) {
  return hellotracksRequest(fetchImpl, auth, "GET", "/auth/whoami");
}

async function listJobs(fetchImpl, auth, params = {}) {
  const data = await hellotracksRequest(fetchImpl, auth, "GET", `/jobs${encodeQuery(params)}`);
  return data.items || [];
}

async function createJob(fetchImpl, auth, job) {
  const data = await hellotracksRequest(fetchImpl, auth, "POST", "/jobs", job);
  return (data.items || [])[0] || null;
}

async function updateJob(fetchImpl, auth, id, job) {
  const data = await hellotracksRequest(fetchImpl, auth, "PATCH", "/jobs", { ...job, id });
  return (data.items || [])[0] || null;
}

async function archiveJob(fetchImpl, auth, id) {
  const data = await hellotracksRequest(fetchImpl, auth, "POST", `/jobs/${encodeURIComponent(id)}/archive`);
  return (data.items || [])[0] || null;
}

async function deleteJob(fetchImpl, auth, id) {
  const data = await hellotracksRequest(fetchImpl, auth, "DELETE", `/jobs/${encodeURIComponent(id)}`);
  return (data.items || [])[0] || null;
}

async function findJobByUidSecondary(fetchImpl, auth, uidSecondary) {
  const items = await listJobs(fetchImpl, auth, { uidSecondary, includeArchived: true, limit: 1 });
  return items[0] || null;
}

async function findMember(fetchImpl, auth, query) {
  const data = await hellotracksRequest(fetchImpl, auth, "GET", `/accounts${encodeQuery({ query, max: 50 })}`);
  const needle = String(query || "").trim().toLowerCase();
  return (data.items || []).find((member) => {
    return [member.id, member.username, member.email, member.name]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase() === needle);
  }) || null;
}

module.exports = {
  DEFAULT_API_BASE,
  normalizeBaseUrl,
  cleanObject,
  hellotracksRequest,
  listJobs,
  createJob,
  updateJob,
  archiveJob,
  deleteJob,
  findJobByUidSecondary,
  findMember,
  testAuth
};
