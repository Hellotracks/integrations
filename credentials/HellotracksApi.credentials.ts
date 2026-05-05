import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class HellotracksApi implements ICredentialType {
	name = 'hellotracksApi';
	displayName = 'Hellotracks API';
	icon = 'file:../nodes/Hellotracks/hellotracks.svg' as const;
	documentationUrl = 'https://api-docs.hellotracks.com';
	test = {
		request: {
			method: 'GET' as const,
			url: 'https://api.hellotracks.com/v1/auth/whoami',
			headers: {
				'API-Key': '={{$credentials.apiKey}}',
				Accept: 'application/json',
			},
		},
	};

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
	];
}
