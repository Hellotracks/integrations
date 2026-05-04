# Hellotracks No-Code Connectors

This directory contains connector packages for power-user automation platforms.

The connector boundary is intentionally the public API:

- API key auth via `API-Key`
- `/v1/jobs`
- `/v1/members`

Do not route Zapier, Make, or n8n through `ExternalIntegrationService`. That service owns native managed integrations such as Monday, HubSpot, and Salesforce.

## Packages

- `zapier/` - canonical private beta Zapier connector
- `make/` - Make custom app blueprint
- `n8n/` - n8n community node scaffold
- `shared/` - small public API client used by connector tests and the Zapier app

## V1 Capabilities

- Create job
- Update job
- Archive job
- Delete job
- Find job by external ID (`externalId`)
- Find member by exact email, username, name, or UID
- Polling triggers for new, updated, and completed jobs
