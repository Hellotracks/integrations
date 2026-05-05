# Publishing And n8n Verification

This package is published as `@hellotracks/n8n-nodes-hellotracks`.

## Verification Candidate Checklist

1. Push the package source to the public GitHub repository:
   `https://github.com/Hellotracks/integrations`.
2. Confirm the package follows n8n community-node basics:
   - package name starts with `@hellotracks/n8n-nodes-`
   - `n8n-community-node-package` is in `keywords`
   - `package.json` contains `n8n.nodes` and `n8n.credentials`
   - no runtime dependencies are required by the packaged node
3. Configure npm trusted publishing for GitHub Actions:
   - npm package: `@hellotracks/n8n-nodes-hellotracks`
   - repository owner: `Hellotracks`
   - repository name: `integrations`
   - workflow file: `publish.yml`
4. Run the GitHub Actions workflow `Publish n8n community node`.
5. Confirm npm shows the new version and provenance metadata.
6. Submit the package in the n8n Creator Portal:
   - package: `@hellotracks/n8n-nodes-hellotracks`
   - repository: `https://github.com/Hellotracks/integrations/tree/master/n8n`
   - documentation: package README
   - support: `support@hellotracks.com`

## Local Validation

```bash
cd n8n
npm ci
npm test
npm run lint
npm pack --dry-run
```

Do not publish verification-candidate versions manually from a laptop. n8n
verification requires an npm provenance statement from GitHub Actions.
