"use strict";

const fs = require("node:fs");
const path = require("node:path");

const appPath = path.join(__dirname, "..", "app.json");
const raw = fs.readFileSync(appPath, "utf8");
const app = JSON.parse(raw);
const serialized = JSON.stringify(app);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function moduleByName(name) {
  return app.modules.find((module) => module.name === name);
}

function fieldNames(module) {
  return (module.mappableParameters || []).map((field) => field.name);
}

function fieldByName(module, name) {
  return (module.mappableParameters || []).find((field) => field.name === name);
}

assert(app.name === "hellotracks", "app name must be hellotracks");
assert(app.version === "0.1.0", "app version must be 0.1.0");
assert(app.base.baseUrl.includes("https://api.hellotracks.com/v1"), "base URL must default to production /v1");
assert(app.base.headers["API-Key"] === "{{connection.apiKey}}", "base must send API-Key header");
assert(app.base.response.error.message.includes("body.error.message"), "base must surface API error messages");
assert(app.connection.communication.url === "/auth/whoami", "connection test must call /auth/whoami");
assert(!serialized.includes("assigneeId"), "Make app must not use assigneeId");
assert(serialized.includes("assigneeUsername"), "Make app must use assigneeUsername");

const expectedModules = {
  createJob: ["action", "POST", "/jobs"],
  updateJob: ["action", "PATCH", "/jobs"],
  archiveJob: ["action", "POST", "/jobs/{{parameters.id}}/archive"],
  deleteJob: ["action", "DELETE", "/jobs/{{parameters.id}}"],
  findJob: ["search", "GET", "/jobs"],
  findMember: ["search", "GET", "/members"],
  watchJobs: ["trigger", "GET", "/jobs"]
};

for (const [name, [type, method, url]] of Object.entries(expectedModules)) {
  const module = moduleByName(name);
  assert(module, `missing module ${name}`);
  assert(module.type === type, `${name} must be type ${type}`);
  assert(module.communication.method === method, `${name} must use ${method}`);
  assert(module.communication.url === url, `${name} must use URL ${url}`);
}

const createJob = moduleByName("createJob");
assert(createJob.mappableParameters === "{{common.jobMappableParameters}}", "createJob must reference common job parameters");
assert(app.common.jobMappableParameters.some((field) => field.name === "assigneeUsername"), "createJob common fields must include assigneeUsername");
assert(app.common.jobMappableParameters.some((field) => field.name === "priority" && field.label === "Priority (0-10)"), "common priority must be labeled Priority (0-10)");
assert(createJob.communication.body.assigneeUsername === "{{parameters.assigneeUsername}}", "createJob body must send assigneeUsername");
assert(createJob.communication.body.contact.email === "{{parameters.contactEmail}}", "createJob body must send nested contact email");
assert(createJob.communication.body.timeWindow.start === "{{parameters.timeWindowStart}}", "createJob body must send nested time window start");

const updateJob = moduleByName("updateJob");
assert(updateJob.communication.body.id === "{{parameters.id}}", "updateJob must send id in JSON body");
assert(!updateJob.communication.url.includes("{{parameters.id}}"), "updateJob must not put id in URL");
assert(fieldNames(updateJob).includes("assigneeUsername"), "updateJob fields must include assigneeUsername");
assert(fieldByName(updateJob, "priority").label === "Priority (0-10)", "updateJob priority label must be Priority (0-10)");

const findJob = moduleByName("findJob");
assert(findJob.communication.qs.externalId === "{{parameters.externalId}}", "findJob must query externalId");
assert(findJob.communication.qs.includeArchived === "true", "findJob must include archived jobs");
assert(findJob.communication.qs.limit === "1", "findJob must limit to 1");

const findMember = moduleByName("findMember");
assert(findMember.communication.qs.query === "{{parameters.query}}", "findMember must query by parameter");
assert(findMember.communication.qs.max === "50", "findMember must request max 50 results");

const watchJobs = moduleByName("watchJobs");
assert(watchJobs.communication.qs.updatedSince === "{{parameters.updatedSince}}", "watchJobs must query updatedSince");
assert(watchJobs.communication.qs.includeArchived === "true", "watchJobs must include archived jobs");
assert(watchJobs.communication.response.trigger.id === "{{item.id}}", "watchJobs must use item id as trigger id");
assert(watchJobs.communication.response.trigger.order === "desc", "watchJobs trigger order must be desc");

console.log("Make app blueprint is valid.");
