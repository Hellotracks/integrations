"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  cleanObject,
  encodeQuery,
  extractHttpErrorMessage,
  extractResponseData,
  normalizeJobPayload,
  normalizeBaseUrl
} = require("../dist/nodes/Hellotracks/helpers.js");

test("normalizeBaseUrl removes trailing slashes", () => {
  assert.equal(normalizeBaseUrl("https://api.hellotracks.com/v1///"), "https://api.hellotracks.com/v1");
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

test("normalizeJobPayload converts numeric connector strings", () => {
  assert.deepEqual(normalizeJobPayload({
    title: "Job",
    priority: "10",
    onSiteDurationSeconds: "900",
    location: { lat: "37.7749", lng: "-122.4194" }
  }), {
    title: "Job",
    priority: 10,
    onSiteDurationSeconds: 900,
    location: { lat: 37.7749, lng: -122.4194 }
  });
});

test("normalizeJobPayload rejects invalid priority text", () => {
  assert.throws(
    () => normalizeJobPayload({ priority: "high" }),
    /Priority must be a number between 0 and 10/
  );
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

test("extractHttpErrorMessage includes public API error body", () => {
  assert.equal(
    extractHttpErrorMessage({
      message: "Request failed with status code 400",
      response: {
        body: {
          error: {
            message: "job.priority must be a number between 0 and 10"
          }
        }
      }
    }),
    "job.priority must be a number between 0 and 10"
  );
});
