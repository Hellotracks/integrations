# Hellotracks Make private QA app

This folder contains the Make custom-app blueprint for the Hellotracks no-code connector.

It calls the public Hellotracks API directly. It does not use `ExternalIntegrationService`, CRM integration state, field mappings, or reconciliation.

## What this app supports

- Create Job
- Update Job
- Archive Job
- Delete Job
- Find Job by External ID
- Find Member
- Watch Jobs, using polling

The app uses the same `/v1` public API contract as Zapier and n8n:

- Production API base: `https://api.hellotracks.com/v1`
- QA API base: `https://qa.hellotracks.com/v1`
- Assignment field: `assigneeUsername`
- External dedupe field: `externalId`
- Job date field: `date`
- Time window fields: `timeWindow.start` and `timeWindow.end`

## Local validation

From this folder:

```bash
npm test
```

This validates that `app.json` parses and still matches the intended Hellotracks `/v1` contract.

## Create the private Make app

1. Log in to Make.
2. Open `Custom Apps`.
3. Create a new private app named `Hellotracks`.
4. Create the connection:
   - Name: `hellotracksApiKey`
   - Label: `Hellotracks API key`
   - Parameters:
     - `apiKey`, type `password`, required
     - `apiBaseUrl`, type `url`, optional, default `https://api.hellotracks.com/v1`
   - Base/header auth:
     - `API-Key: {{connection.apiKey}}`
     - `Accept: application/json`
     - `Content-Type: application/json`
   - Connection test request:
     - `GET /auth/whoami`
5. Copy the Base, Connection, and Module sections from `app.json` into the Make custom-app editor.

Make stores custom apps as separate Base, Connection, Module, Interface, and Sample tabs. `app.json` is the source blueprint for those tabs, not a Runtime artifact.

## QA credentials

Create a connection in the Make scenario builder:

- Hellotracks API key: use the dedicated QA key.
- API Base URL: `https://qa.hellotracks.com/v1`

Use production only after QA passes:

- API Base URL: `https://api.hellotracks.com/v1`

## QA smoke scenario

Use disposable QA jobs only.

1. `Find Member`
   - Query: known Hellotracks username or email.
   - Expected: one member result with `id`, `username`, `email`, and `name`.
2. `Create Job`
   - Title: `Make QA job`
   - External ID: unique value, for example `make-qa-<timestamp>`
   - Job date: `YYYY-MM-DD`
   - Assignee username: output from `Find Member`, or a known Hellotracks username.
   - Priority: blank, then repeat with `10`.
   - Expected: a job result with `id`.
3. `Find Job`
   - External ID: the same value used in Create Job.
   - Expected: the created job.
4. `Update Job`
   - Job ID: output from Find Job.
   - Change title or notes.
   - Expected: updated job result.
5. `Archive Job`
   - Job ID: disposable QA job ID.
   - Expected: archived job result.
6. `Delete Job`
   - Job ID: disposable QA job ID only.
   - Expected: delete succeeds.
7. `Watch Jobs`
   - Limit: `10`
   - Expected: newest updated jobs are returned.

## Share with QA

For private QA, keep the app private and share it from Make's Custom Apps area with QA users or the QA organization. Public Make review is intentionally deferred until the private app passes smoke testing.

Before public review, we still need app metadata, logo, support/docs links, and clean Make test scenarios for each module.
