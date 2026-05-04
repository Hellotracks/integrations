import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class HellotracksApi implements ICredentialType {
	name = 'hellotracksApi';
	displayName = 'Hellotracks API';
	documentationUrl = 'https://api-docs.hellotracks.com';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
		{
			displayName: 'API Base URL',
			name: 'apiBaseUrl',
			type: 'string',
			default: 'https://api.hellotracks.com/api/public/v1',
			required: true,
		},
	];
}
