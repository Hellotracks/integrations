import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class HellotracksApi implements ICredentialType {
	name = 'hellotracksApi';
	displayName = 'Hellotracks API';
	icon = 'file:../nodes/Hellotracks/hellotracks.svg' as const;
	documentationUrl = 'https://api-docs.hellotracks.com';

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'API-Key': '={{$credentials.apiKey}}',
				Accept: 'application/json',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			method: 'GET',
			baseURL: 'https://api.hellotracks.com/v1',
			url: '/auth/whoami',
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
