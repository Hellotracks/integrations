# Hellotracks n8n Node

Use Hellotracks jobs in n8n workflows.

The node connects n8n to the Hellotracks public API at
`https://api.hellotracks.com/v1`.

## Installation

In a self-hosted n8n instance with community nodes enabled:

1. Go to `Settings -> Community Nodes`.
2. Click `Install`.
3. Install:

```text
@hellotracks/n8n-nodes-hellotracks
```

Restart n8n if prompted. Then add the `Hellotracks` node to a workflow.

## Credentials

Create a Hellotracks credential with:

- API Key: a Hellotracks public API key

The node sends the API key in the `API-Key` request header. No API base URL
setting is required.

## Operations

- Create Job: `POST /jobs`
- Update Job: `PATCH /jobs`
- Archive Job: `POST /jobs/{id}/archive`
- Delete Job: `DELETE /jobs/{id}`
- Find Job: `GET /jobs?externalId=...&includeArchived=true&limit=1`
- Find Member: `GET /members?query=...&max=50`

Create and update support `externalId`, `title`, `address`, `notes`, `date`, `assigneeUsername`, `priority`, contact fields, and time window fields.

`assigneeUsername` is the intended assignment field. Do not use `assigneeId`
with this connector.

## Field Notes

- `External ID`: optional external dedupe key.
- `Job Date`: `YYYY-MM-DD`, for example `2026-05-05`.
- `Assignee Username`: Hellotracks username, often the member email or login name.
- `Priority (0-10)`: optional integer from 0 to 10.
- `Window Start` and `Window End`: `HH:mm`, for example `09:00`.

Blank optional fields are omitted before the node calls the Hellotracks API.

## Example Workflows

- Create a Hellotracks job from a Google Sheets row.
- Find a Hellotracks member by email, then create a job assigned to that member.
- Find a job by External ID and update its address, notes, date, or assignee.
- Archive or delete disposable jobs during testing.

## Development

```bash
cd n8n
npm ci
npm test
npm run lint
npm pack --dry-run
```

## Publishing

Verification-candidate releases are published from GitHub Actions with npm
provenance. See `PUBLISHING.md`.

## Support

For product support, contact support@hellotracks.com.

For package bugs, open an issue at:

https://github.com/Hellotracks/integrations/issues
