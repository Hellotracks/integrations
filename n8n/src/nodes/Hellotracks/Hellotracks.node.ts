import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	IHttpRequestOptions,
} from 'n8n-workflow';

type Credentials = {
	apiKey: string;
	apiBaseUrl: string;
};

async function request(this: IExecuteFunctions, credentials: Credentials, method: string, path: string, body?: IDataObject) {
	const baseUrl = credentials.apiBaseUrl.replace(/\/+$/, '');
	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${path}`,
		headers: {
			'API-Key': credentials.apiKey,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		json: true,
	};
	if (body) {
		options.body = Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined && value !== null && value !== ''));
	}
	const response = await this.helpers.httpRequest(options);
	if (response.error) {
		throw new Error(response.error.message || 'Hellotracks request failed');
	}
	return response.data || response;
}

export class Hellotracks implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Hellotracks',
		name: 'hellotracks',
		icon: 'file:hellotracks.svg',
		group: ['transform'],
		version: 1,
		description: 'Create, update, find, archive, and delete Hellotracks jobs',
		defaults: {
			name: 'Hellotracks',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'hellotracksApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				default: 'createJob',
				options: [
					{ name: 'Create Job', value: 'createJob' },
					{ name: 'Update Job', value: 'updateJob' },
					{ name: 'Archive Job', value: 'archiveJob' },
					{ name: 'Delete Job', value: 'deleteJob' },
					{ name: 'Find Job', value: 'findJob' },
					{ name: 'Find Member', value: 'findMember' },
				],
			},
			{ displayName: 'Job ID', name: 'id', type: 'string', default: '', displayOptions: { show: { operation: ['updateJob', 'archiveJob', 'deleteJob'] } } },
			{ displayName: 'External ID', name: 'externalId', type: 'string', default: '', displayOptions: { show: { operation: ['createJob', 'updateJob', 'findJob'] } } },
			{ displayName: 'Title', name: 'title', type: 'string', default: '', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Address', name: 'address', type: 'string', default: '', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Notes', name: 'notes', type: 'string', default: '', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Job Date', name: 'date', type: 'string', default: '', description: 'YYYY-MM-DD, for example 2026-04-30.', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Assignee Username', name: 'assigneeUsername', type: 'string', default: '', description: 'Hellotracks username, often the member email or login name.', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Search Query', name: 'query', type: 'string', default: '', displayOptions: { show: { operation: ['findMember'] } } },
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const credentials = await this.getCredentials('hellotracksApi') as Credentials;
		const inputItems = this.getInputData();
		const results: INodeExecutionData[] = [];
		for (let i = 0; i < inputItems.length; i++) {
			const operation = this.getNodeParameter('operation', i) as string;
			const body = {
				externalId: this.getNodeParameter('externalId', i, '') as string,
				title: this.getNodeParameter('title', i, '') as string,
				address: this.getNodeParameter('address', i, '') as string,
				notes: this.getNodeParameter('notes', i, '') as string,
				date: this.getNodeParameter('date', i, '') as string,
				assigneeUsername: this.getNodeParameter('assigneeUsername', i, '') as string,
			};
			let data;
			if (operation === 'createJob') {
				data = await request.call(this, credentials, 'POST', '/jobs', body);
			} else if (operation === 'updateJob') {
				const id = encodeURIComponent(this.getNodeParameter('id', i) as string);
				data = await request.call(this, credentials, 'PATCH', `/jobs/${id}`, body);
			} else if (operation === 'archiveJob') {
				const id = encodeURIComponent(this.getNodeParameter('id', i) as string);
				data = await request.call(this, credentials, 'POST', `/jobs/${id}/archive`);
			} else if (operation === 'deleteJob') {
				const id = encodeURIComponent(this.getNodeParameter('id', i) as string);
				data = await request.call(this, credentials, 'DELETE', `/jobs/${id}`);
			} else if (operation === 'findJob') {
				const externalId = encodeURIComponent(this.getNodeParameter('externalId', i) as string);
				data = await request.call(this, credentials, 'GET', `/jobs?externalId=${externalId}&includeArchived=true&limit=1`);
			} else {
				const query = encodeURIComponent(this.getNodeParameter('query', i) as string);
				data = await request.call(this, credentials, 'GET', `/members?query=${query}&max=50`);
			}
			const items = Array.isArray(data.items) ? data.items : [data];
			for (const item of items) {
				results.push({ json: item });
			}
		}
		return [results];
	}
}
