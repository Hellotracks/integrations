import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	IHttpRequestOptions,
} from 'n8n-workflow';

import {
	cleanObject,
	encodeQuery,
	extractHttpErrorMessage,
	extractResponseData,
	normalizeBaseUrl,
	normalizeJobPayload,
	type HellotracksCredentials,
} from './helpers';

async function request(this: IExecuteFunctions, credentials: HellotracksCredentials, method: IHttpRequestOptions['method'], path: string, body?: IDataObject) {
	const baseUrl = normalizeBaseUrl(credentials.apiBaseUrl);
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
		options.body = cleanObject(body);
	}
	try {
		const response = await this.helpers.httpRequest(options);
		return extractResponseData(response as IDataObject);
	} catch (error) {
		const message = extractHttpErrorMessage(error);
		throw new Error(`Hellotracks ${method} ${path} failed: ${message}`);
	}
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
			{ displayName: 'Job ID', name: 'id', type: 'string', default: '', required: true, displayOptions: { show: { operation: ['updateJob', 'archiveJob', 'deleteJob'] } } },
			{ displayName: 'External ID', name: 'externalId', type: 'string', default: '', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Title', name: 'title', type: 'string', default: '', required: true, displayOptions: { show: { operation: ['createJob'] } } },
			{ displayName: 'Title', name: 'title', type: 'string', default: '', displayOptions: { show: { operation: ['updateJob'] } } },
			{ displayName: 'Address', name: 'address', type: 'string', default: '', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Notes', name: 'notes', type: 'string', default: '', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Job Date', name: 'date', type: 'string', default: '', description: 'YYYY-MM-DD, for example 2026-04-30.', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Assignee Username', name: 'assigneeUsername', type: 'string', default: '', description: 'Hellotracks username, often the member email or login name.', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Priority (0-10)', name: 'priority', type: 'number', default: undefined, typeOptions: { minValue: 0, maxValue: 10, numberPrecision: 0 }, displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Contact Name', name: 'contactName', type: 'string', default: '', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Contact Phone', name: 'contactPhone', type: 'string', default: '', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Contact Email', name: 'contactEmail', type: 'string', default: '', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Window Start', name: 'timeWindowStart', type: 'string', default: '', description: 'HH:mm time, for example 09:00.', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Window End', name: 'timeWindowEnd', type: 'string', default: '', description: 'HH:mm time, for example 17:00.', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'External ID', name: 'externalId', type: 'string', default: '', required: true, displayOptions: { show: { operation: ['findJob'] } } },
			{ displayName: 'Email, Username, Name, or UID', name: 'query', type: 'string', default: '', required: true, displayOptions: { show: { operation: ['findMember'] } } },
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const credentials = await this.getCredentials('hellotracksApi') as HellotracksCredentials;
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
				priority: this.getNodeParameter('priority', i, '') as string | number,
				contact: {
					name: this.getNodeParameter('contactName', i, '') as string,
					phone: this.getNodeParameter('contactPhone', i, '') as string,
					email: this.getNodeParameter('contactEmail', i, '') as string,
				},
				timeWindow: {
					start: this.getNodeParameter('timeWindowStart', i, '') as string,
					end: this.getNodeParameter('timeWindowEnd', i, '') as string,
				},
			};
			let data;
			if (operation === 'createJob') {
				data = await request.call(this, credentials, 'POST', '/jobs', normalizeJobPayload(body));
			} else if (operation === 'updateJob') {
				data = await request.call(this, credentials, 'PATCH', '/jobs', {
					...normalizeJobPayload(body),
					id: this.getNodeParameter('id', i) as string,
				});
			} else if (operation === 'archiveJob') {
				const id = encodeURIComponent(this.getNodeParameter('id', i) as string);
				data = await request.call(this, credentials, 'POST', `/jobs/${id}/archive`);
			} else if (operation === 'deleteJob') {
				const id = encodeURIComponent(this.getNodeParameter('id', i) as string);
				data = await request.call(this, credentials, 'DELETE', `/jobs/${id}`);
			} else if (operation === 'findJob') {
				data = await request.call(this, credentials, 'GET', `/jobs${encodeQuery({
					externalId: this.getNodeParameter('externalId', i) as string,
					includeArchived: true,
					limit: 1,
				})}`);
			} else {
				data = await request.call(this, credentials, 'GET', `/members${encodeQuery({
					query: this.getNodeParameter('query', i) as string,
					max: 50,
				})}`);
			}
			const items = Array.isArray(data.items) ? data.items : [data];
			for (const item of items) {
				results.push({ json: item });
			}
		}
		return [results];
	}
}
