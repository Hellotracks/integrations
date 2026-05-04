# Hellotracks Make App

This package contains the Make custom app blueprint for the Hellotracks no-code MVP.

Import `app.json` into Make's custom app editor, configure the `API-Key` connection, and use the same `/api/public/v1` contract as Zapier and n8n.

V1 modules:

- Create Job
- Update Job
- Archive Job
- Delete Job
- Find Job by External ID
- Find Member
- Watch Jobs (polling)

The app intentionally does not use `ExternalIntegrationService`; it calls the public API directly.
