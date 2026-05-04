# Hellotracks n8n Node

Private beta n8n community node for Hellotracks power-user workflows.

This package targets self-hosted or local n8n QA first. It is not submitted to the n8n Cloud community catalog yet.

## Credentials

Create a Hellotracks credential with:

- API Key: a Hellotracks public API key
- API Base URL: `https://qa.hellotracks.com/v1` for QA or `https://api.hellotracks.com/v1` for production

The node sends the API key in the `API-Key` header.

## Operations

- Create Job: `POST /jobs`
- Update Job: `PATCH /jobs`
- Archive Job: `POST /jobs/{id}/archive`
- Delete Job: `DELETE /jobs/{id}`
- Find Job: `GET /jobs?externalId=...&includeArchived=true&limit=1`
- Find Member: `GET /members?query=...&max=50`

Create and update support `externalId`, `title`, `address`, `notes`, `date`, `assigneeUsername`, `placeId`, `priority`, contact fields, and time window fields.

## Build And Pack

```bash
cd /Users/bertschler/git/hellotracks/integrations/n8n
npm install
npm test
npm pack
```

## Local n8n Install

```bash
mkdir -p ~/.n8n/nodes
cd ~/.n8n/nodes
npm install /Users/bertschler/git/hellotracks/integrations/n8n/n8n-nodes-hellotracks-0.1.0.tgz
npx n8n@latest start
```

Open n8n, create a Hellotracks API credential, set `API Base URL` to `https://qa.hellotracks.com/v1`, then add the Hellotracks node to a workflow.

## QA Smoke Test

Use disposable QA data:

1. Create Job from manual input.
2. Create Job from a Google Sheets row.
3. Find Job by External ID.
4. Find Member by email or username.
5. Update Job using the found Job ID.
6. Archive or delete only disposable jobs.

`assigneeUsername` is the intended assignment field. Do not use `assigneeId` for this connector.
