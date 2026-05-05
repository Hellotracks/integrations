"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const App = require("./index.js");

const authData = {
  apiKey: "secret"
};

function makeZapier(payload) {
  const calls = [];
  return {
    calls,
    z: {
      request: async (request) => {
        calls.push(request);
        return {
          status: 200,
          content: JSON.stringify(payload)
        };
      }
    }
  };
}

test("auth checks /auth/whoami with API key", async () => {
  const helper = makeZapier({ data: { company: { name: "Hellotracks QA" } } });

  const result = await App.authentication.test(helper.z, { authData });

  assert.equal(result.company.name, "Hellotracks QA");
  assert.equal(helper.calls[0].url, "https://api.hellotracks.com/v1/auth/whoami");
  assert.equal(helper.calls[0].method, "GET");
  assert.equal(helper.calls[0].headers["API-Key"], "secret");
});

test("create job maps Zapier fields to the public job payload", async () => {
  const helper = makeZapier({ data: { items: [{ id: "job_1", externalId: "crm-1" }] } });

  const result = await App.creates.create_job.operation.perform(helper.z, {
    authData,
    inputData: {
      title: "Install",
      externalId: "crm-1",
      address: "123 Main St",
      notes: "Gate code 1234",
      date: "2026-05-04",
      assigneeUsername: "worker@example.com",
      priority: "2",
      contactName: "Customer",
      contactPhone: "+15555550123",
      contactEmail: "customer@example.com",
      timeWindowStart: "09:00",
      timeWindowEnd: "17:00"
    }
  });

  assert.equal(result.id, "job_1");
  assert.equal(helper.calls[0].url, "https://api.hellotracks.com/v1/jobs");
  assert.equal(helper.calls[0].method, "POST");
  assert.deepEqual(JSON.parse(helper.calls[0].body), {
    title: "Install",
    externalId: "crm-1",
    address: "123 Main St",
    notes: "Gate code 1234",
    date: "2026-05-04",
    assigneeUsername: "worker@example.com",
    priority: 2,
    contact: {
      name: "Customer",
      phone: "+15555550123",
      email: "customer@example.com"
    },
    timeWindow: {
      start: "09:00",
      end: "17:00"
    }
  });
});

test("create job rejects invalid priority before calling API", async () => {
  const helper = makeZapier({ data: { items: [{ id: "job_1" }] } });

  await assert.rejects(
    () => App.creates.create_job.operation.perform(helper.z, {
      authData,
      inputData: {
        title: "Install",
        priority: "high"
      }
    }),
    /Priority must be a number between 0 and 10/
  );
  assert.equal(helper.calls.length, 0);
});

test("update job uses PATCH /jobs with id in the public job payload", async () => {
  const helper = makeZapier({ data: { items: [{ id: "job_2", title: "Updated" }] } });

  await App.creates.update_job.operation.perform(helper.z, {
    authData,
    inputData: {
      id: "job_2",
      title: "Updated",
      externalId: "crm-2"
    }
  });

  assert.equal(helper.calls[0].url, "https://api.hellotracks.com/v1/jobs");
  assert.equal(helper.calls[0].method, "PATCH");
  assert.deepEqual(JSON.parse(helper.calls[0].body), {
    title: "Updated",
    externalId: "crm-2",
    id: "job_2"
  });
});

test("find job searches by externalId and returns an array", async () => {
  const helper = makeZapier({ data: { items: [{ id: "job_3", externalId: "crm-3" }] } });

  const result = await App.searches.find_job.operation.perform(helper.z, {
    authData,
    inputData: { externalId: "crm-3" }
  });

  assert.deepEqual(result, [{ id: "job_3", externalId: "crm-3" }]);
  assert.equal(helper.calls[0].url, "https://api.hellotracks.com/v1/jobs?externalId=crm-3&includeArchived=true&limit=1");
  assert.equal(helper.calls[0].method, "GET");
});

test("find member searches /members and returns exact matches as an array", async () => {
  const helper = makeZapier({
    data: {
      items: [
        { id: "worker_1", username: "worker1", email: "one@example.com", name: "One" },
        { id: "worker_2", username: "worker2", email: "two@example.com", name: "Two" }
      ]
    }
  });

  const result = await App.searches.find_member.operation.perform(helper.z, {
    authData,
    inputData: { query: "two@example.com" }
  });

  assert.deepEqual(result, [{ id: "worker_2", username: "worker2", email: "two@example.com", name: "Two" }]);
  assert.equal(helper.calls[0].url, "https://api.hellotracks.com/v1/members?query=two%40example.com&max=50");
});

test("polling triggers request created and updated jobs from /jobs", async () => {
  const helper = makeZapier({ data: { items: [{ id: "job_4", progress: "scheduled" }] } });

  await App.triggers.new_job.operation.perform(helper.z, { authData });
  await App.triggers.updated_job.operation.perform(helper.z, { authData });

  assert.equal(helper.calls[0].url, "https://api.hellotracks.com/v1/jobs?limit=100&includeArchived=true&createdSince=0");
  assert.equal(helper.calls[1].url, "https://api.hellotracks.com/v1/jobs?limit=100&includeArchived=true&updatedSince=0");
});

test("completed trigger only returns successful jobs", async () => {
  const helper = makeZapier({
    data: {
      items: [
        { id: "job_5", progress: "success" },
        { id: "job_6", progress: "scheduled" }
      ]
    }
  });

  const result = await App.triggers.completed_job.operation.perform(helper.z, { authData });

  assert.deepEqual(result, [{ id: "job_5", progress: "success" }]);
});
