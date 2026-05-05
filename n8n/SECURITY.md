# Security

Report suspected vulnerabilities to support@hellotracks.com.

Do not open public GitHub issues for secrets, API keys, tokens, customer data,
or vulnerability details. Include the package version, affected workflow, and
minimal reproduction details in the report.

The Hellotracks n8n node stores only the configured Hellotracks API key in n8n
credentials. It sends the key in the `API-Key` request header to
`https://api.hellotracks.com/v1`.
