"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  cleanObject,
  encodeQuery,
  extractResponseData,
  normalizeBaseUrl
} = require("../dist/nodes/Hellotracks/helpers.js");

test("normalizeBaseUrl removes trailing slashes", () => {
  assert.equal(normalizeBaseUrl("https://qa.hellotracks.com/v1///"), "https://qa.hellotracks.com/v1");
});

test("encodeQuery omits empty values", () => {
  assert.equal(
    encodeQuery({ externalId: "crm 1", includeArchived: true, limit: 1, empty: "" }),
    "?externalId=crm%201&includeArchived=true&limit=1"
  );
});

test("cleanObject removes empty optional fields recursively", () => {
  assert.deepEqual(cleanObject({
    title: "Job",
    address: "",
    contact: { name: "", email: "contact@example.com" },
    timeWindow: { start: "", end: null },
    customFields: {}
  }), {
    title: "Job",
    contact: { email: "contact@example.com" }
  });
});

test("extractResponseData unwraps public API data envelope", () => {
  assert.deepEqual(extractResponseData({ data: { items: [{ id: "job_1" }] } }), {
    items: [{ id: "job_1" }]
  });
});

test("extractResponseData turns API error into readable error", () => {
  assert.throws(
    () => extractResponseData({ error: { message: "Unknown field job.assigneeUsername" } }),
    /Unknown field job\.assigneeUsername/
  );
});
