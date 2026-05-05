"use strict";

const {
  DEFAULT_API_BASE,
  testAuth,
  listJobs,
  createJob,
  updateJob,
  archiveJob,
  deleteJob,
  findJobByExternalId,
  findMember
} = require("./shared/hellotracks-client.cjs");

const fetchWithZapier = (z) => async (url, request) => {
  const response = await z.request({
    url,
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    text: async () => response.content || JSON.stringify(response.json || {})
  };
};

const auth = (bundle) => ({
  apiKey: bundle.authData.apiKey,
  apiBaseUrl: bundle.authData.apiBaseUrl || DEFAULT_API_BASE
});

const jobInputFields = [
  { key: "title", label: "Title", required: true },
  { key: "externalId", label: "External ID", helpText: "Stable ID from the source app. Hellotracks uses this for upsert/dedupe." },
  { key: "address", label: "Address" },
  { key: "notes", label: "Notes" },
  { key: "date", label: "Job date", helpText: "YYYY-MM-DD, for example 2026-04-30." },
  { key: "assigneeUsername", label: "Assignee username", helpText: "Hellotracks username, often the member's email or login name." },
  { key: "priority", label: "Priority (0-10)", type: "integer" },
  { key: "contactName", label: "Contact name" },
  { key: "contactPhone", label: "Contact phone" },
  { key: "contactEmail", label: "Contact email" },
  { key: "timeWindowStart", label: "Window start", helpText: "HH:mm time, for example 09:00." },
  { key: "timeWindowEnd", label: "Window end", helpText: "HH:mm time, for example 17:00." }
];

const jobOutputFields = [
  { key: "id", label: "Job ID" },
  { key: "externalId", label: "External ID" },
  { key: "title", label: "Title" },
  { key: "progress", label: "Progress" },
  { key: "date", label: "Date" },
  { key: "createdAt", label: "Created at", type: "integer" },
  { key: "updatedAt", label: "Updated at", type: "integer" },
  { key: "assignee.email", label: "Assignee email" },
  { key: "address", label: "Address" },
  { key: "contact.email", label: "Contact email" }
];

function toJobPayload(input) {
  return {
    title: input.title,
    externalId: input.externalId,
    address: input.address,
    notes: input.notes,
    date: input.date,
    assigneeUsername: input.assigneeUsername,
    priority: input.priority,
    contact: {
      name: input.contactName,
      phone: input.contactPhone,
      email: input.contactEmail
    },
    timeWindow: {
      start: input.timeWindowStart,
      end: input.timeWindowEnd
    }
  };
}

const performListJobs = (params) => async (z, bundle) => listJobs(fetchWithZapier(z), auth(bundle), {
  limit: 100,
  includeArchived: true,
  ...params
});

const asSearchResults = (result) => result ? [result] : [];

const App = {
  version: require("./package.json").version,
  platformVersion: require("zapier-platform-core").version,
  authentication: {
    type: "custom",
    fields: [
      { key: "apiKey", label: "Hellotracks API Key", required: true, type: "password" },
      { key: "apiBaseUrl", label: "API Base URL", required: false, default: DEFAULT_API_BASE }
    ],
    test: async (z, bundle) => testAuth(fetchWithZapier(z), auth(bundle)),
    connectionLabel: "{{company.name}}"
  },
  resources: {},
  triggers: {
    new_job: {
      key: "new_job",
      noun: "Job",
      display: {
        label: "New Job",
        description: "Triggers when a Hellotracks job is created."
      },
      operation: {
        perform: performListJobs({ createdSince: 0 }),
        sample: { id: "job_id", title: "Example job", progress: "scheduled", externalId: "external-123" },
        outputFields: jobOutputFields
      }
    },
    updated_job: {
      key: "updated_job",
      noun: "Job",
      display: {
        label: "Updated Job",
        description: "Triggers when a Hellotracks job is created, assigned, completed, archived, or otherwise updated."
      },
      operation: {
        perform: performListJobs({ updatedSince: 0 }),
        sample: { id: "job_id", title: "Example job", progress: "scheduled", updatedAt: 1777560000000 },
        outputFields: jobOutputFields
      }
    },
    completed_job: {
      key: "completed_job",
      noun: "Job",
      display: {
        label: "Completed Job",
        description: "Triggers when a Hellotracks job reaches a completed state."
      },
      operation: {
        perform: async (z, bundle) => (await performListJobs({ updatedSince: 0 })(z, bundle))
          .filter((job) => job.progress === "success"),
        sample: { id: "job_id", title: "Example completed job", progress: "success" },
        outputFields: jobOutputFields
      }
    }
  },
  creates: {
    create_job: {
      key: "create_job",
      noun: "Job",
      display: {
        label: "Create Job",
        description: "Creates or updates a Hellotracks job. If External ID matches an existing job, Hellotracks updates it."
      },
      operation: {
        inputFields: jobInputFields,
        perform: (z, bundle) => createJob(fetchWithZapier(z), auth(bundle), toJobPayload(bundle.inputData)),
        sample: { id: "job_id", title: "Example job" },
        outputFields: jobOutputFields
      }
    },
    update_job: {
      key: "update_job",
      noun: "Job",
      display: {
        label: "Update Job",
        description: "Updates a Hellotracks job by ID."
      },
      operation: {
        inputFields: [{ key: "id", label: "Job ID", required: true }, ...jobInputFields],
        perform: (z, bundle) => updateJob(fetchWithZapier(z), auth(bundle), bundle.inputData.id, toJobPayload(bundle.inputData)),
        sample: { id: "job_id", title: "Updated job" },
        outputFields: jobOutputFields
      }
    },
    archive_job: {
      key: "archive_job",
      noun: "Job",
      display: {
        label: "Archive Job",
        description: "Archives a Hellotracks job by ID."
      },
      operation: {
        inputFields: [{ key: "id", label: "Job ID", required: true }],
        perform: (z, bundle) => archiveJob(fetchWithZapier(z), auth(bundle), bundle.inputData.id),
        sample: { id: "job_id" },
        outputFields: jobOutputFields
      }
    },
    delete_job: {
      key: "delete_job",
      noun: "Job",
      display: {
        label: "Delete Job",
        description: "Deletes a Hellotracks job by ID."
      },
      operation: {
        inputFields: [{ key: "id", label: "Job ID", required: true }],
        perform: (z, bundle) => deleteJob(fetchWithZapier(z), auth(bundle), bundle.inputData.id),
        sample: { id: "job_id" },
        outputFields: jobOutputFields
      }
    }
  },
  searches: {
    find_job: {
      key: "find_job",
      noun: "Job",
      display: {
        label: "Find Job",
        description: "Finds a Hellotracks job by External ID."
      },
      operation: {
        inputFields: [{ key: "externalId", label: "External ID", required: true }],
        perform: async (z, bundle) => asSearchResults(await findJobByExternalId(fetchWithZapier(z), auth(bundle), bundle.inputData.externalId)),
        sample: { id: "job_id", externalId: "external-123" },
        outputFields: jobOutputFields
      }
    },
    find_member: {
      key: "find_member",
      noun: "Member",
      display: {
        label: "Find Member",
        description: "Finds a Hellotracks member by exact email, username, name, or UID."
      },
      operation: {
        inputFields: [{ key: "query", label: "Email, username, name, or UID", required: true }],
        perform: async (z, bundle) => asSearchResults(await findMember(fetchWithZapier(z), auth(bundle), bundle.inputData.query)),
        sample: { id: "member_uid", username: "worker", email: "worker@example.com", name: "Worker" },
        outputFields: [
          { key: "id", label: "Member UID" },
          { key: "username", label: "Username" },
          { key: "email", label: "Email" },
          { key: "name", label: "Name" }
        ]
      }
    }
  }
};

module.exports = App;
