"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  cleanObject,
  normalizeBaseUrl,
  testAuth,
  createJob,
  updateJob,
  findJobByExternalId,
  findMember
} = require("./hellotracks-client.cjs");

function jsonResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return JSON.stringify(payload);
    }
  };
}

test("normalizeBaseUrl removes trailing slashes", () => {
  assert.equal(normalizeBaseUrl("https://api.example.test/v1///"), "https://api.example.test/v1");
});

test("cleanObject removes empty optional fields recursively", () => {
  assert.deepEqual(cleanObject({
    title: "Job",
    address: "",
    contact: { name: "", phone: undefined },
    location: { lat: 1, lng: undefined },
    timeWindow: { start: "", end: null },
    customFields: { source: "zapier", empty: "" }
  }), {
    title: "Job",
    location: { lat: 1 },
    customFields: { source: "zapier" }
  });
});

test("testAuth checks /auth/whoami", async () => {
  const calls = [];
  const fetchImpl = async (url, request) => {
    calls.push({ url, request });
    return jsonResponse(200, { data: { company: { name: "Hellotracks QA" } } });
  };

  const result = await testAuth(fetchImpl, { apiKey: "secret", apiBaseUrl: "https://qa.example.test/v1" });

  assert.equal(result.company.name, "Hellotracks QA");
  assert.equal(calls[0].url, "https://qa.example.test/v1/auth/whoami");
  assert.equal(calls[0].request.method, "GET");
});

test("createJob sends API key and returns first created job", async () => {
  const calls = [];
  const fetchImpl = async (url, request) => {
    calls.push({ url, request });
    return jsonResponse(201, { data: { items: [{ id: "job_1", externalId: "crm-1" }] } });
  };

  const job = await createJob(fetchImpl, { apiKey: "secret", apiBaseUrl: "https://qa.example.test/v1" }, {
    title: "Install",
    externalId: "crm-1"
  });

  assert.equal(job.id, "job_1");
  assert.equal(calls[0].url, "https://qa.example.test/v1/jobs");
  assert.equal(calls[0].request.headers["API-Key"], "secret");
  assert.equal(JSON.parse(calls[0].request.body).externalId, "crm-1");
});

test("updateJob sends PATCH with id", async () => {
  const calls = [];
  const fetchImpl = async (url, request) => {
    calls.push({ url, request });
    return jsonResponse(200, { data: { items: [{ id: "job_1", externalId: "crm-1" }] } });
  };

  const job = await updateJob(fetchImpl, { apiKey: "secret", apiBaseUrl: "https://qa.example.test/v1" }, "job_1", {
    title: "Install updated",
    externalId: "crm-1"
  });

  assert.equal(job.id, "job_1");
  assert.equal(calls[0].url, "https://qa.example.test/v1/jobs");
  assert.equal(calls[0].request.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[0].request.body), {
    title: "Install updated",
    externalId: "crm-1",
    id: "job_1"
  });
});

test("findJobByExternalId queries stable external id", async () => {
  const calls = [];
  const fetchImpl = async (url, request) => {
    calls.push({ url, request });
    return jsonResponse(200, { data: { items: [{ id: "job_2", externalId: "crm-2" }] } });
  };

  const job = await findJobByExternalId(fetchImpl, { apiKey: "secret" }, "crm-2");

  assert.equal(job.id, "job_2");
  assert.match(calls[0].url, /externalId=crm-2/);
  assert.match(calls[0].url, /includeArchived=true/);
});

test("findMember matches exact email username name or id", async () => {
  const fetchImpl = async () => jsonResponse(200, {
    data: {
      items: [
        { id: "u1", username: "worker1", email: "one@example.com", name: "One" },
        { id: "u2", username: "worker2", email: "two@example.com", name: "Two" }
      ]
    }
  });

  const member = await findMember(fetchImpl, { apiKey: "secret" }, "two@example.com");

  assert.equal(member.id, "u2");
});
