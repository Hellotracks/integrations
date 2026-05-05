import {
	NodeConnectionTypes,
	NodeOperationError,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type IDataObject,
	type IHttpRequestOptions,
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

async function request(this: IExecuteFunctions, credentials: HellotracksCredentials, method: IHttpRequestOptions['method'], path: string, itemIndex: number, body?: IDataObject) {
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
		throw new NodeOperationError(this.getNode(), `Hellotracks ${method} ${path} failed: ${message}`, { itemIndex });
	}
}

export class Hellotracks implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Hellotracks',
		name: 'hellotracks',
		icon: 'file:hellotracks.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Create, update, find, archive, and delete Hellotracks jobs',
		defaults: {
			name: 'Hellotracks',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'hellotracksApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: 'job',
				options: [
					{ name: 'Job', value: 'job' },
					{ name: 'Member', value: 'member' },
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['job'] } },
				default: 'createJob',
				options: [
					{ name: 'Archive Job', value: 'archiveJob', action: 'Archive a job' },
					{ name: 'Create Job', value: 'createJob', action: 'Create a job' },
					{ name: 'Delete Job', value: 'deleteJob', action: 'Delete a job' },
					{ name: 'Find Job', value: 'findJob', action: 'Find a job' },
					{ name: 'Update Job', value: 'updateJob', action: 'Update a job' },
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['member'] } },
				default: 'findMember',
				options: [
					{ name: 'Find Member', value: 'findMember', action: 'Find a member' },
				],
			},
			{ displayName: 'Job ID', name: 'id', type: 'string', default: '', required: true, displayOptions: { show: { operation: ['updateJob', 'archiveJob', 'deleteJob'] } } },
			{ displayName: 'External ID', name: 'externalId', type: 'string', default: '', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Title', name: 'title', type: 'string', default: '', required: true, displayOptions: { show: { operation: ['createJob'] } } },
			{ displayName: 'Title', name: 'title', type: 'string', default: '', displayOptions: { show: { operation: ['updateJob'] } } },
			{ displayName: 'Address', name: 'address', type: 'string', default: '', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Notes', name: 'notes', type: 'string', default: '', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Job Date', name: 'date', type: 'string', default: '', description: 'YYYY-MM-DD, for example 2026-04-30', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Assignee Username', name: 'assigneeUsername', type: 'string', default: '', description: 'Hellotracks username, often the member email or login name', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Priority (0-10)', name: 'priority', type: 'number', default: undefined, typeOptions: { minValue: 0, maxValue: 10, numberPrecision: 0 }, displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Contact Name', name: 'contactName', type: 'string', default: '', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Contact Phone', name: 'contactPhone', type: 'string', default: '', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Contact Email', name: 'contactEmail', type: 'string', default: '', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Window Start', name: 'timeWindowStart', type: 'string', default: '', description: 'HH:mm time, for example 09:00', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'Window End', name: 'timeWindowEnd', type: 'string', default: '', description: 'HH:mm time, for example 17:00', displayOptions: { show: { operation: ['createJob', 'updateJob'] } } },
			{ displayName: 'External ID', name: 'externalId', type: 'string', default: '', required: true, displayOptions: { show: { operation: ['findJob'] } } },
			{ displayName: 'Email, Username, Name, or UID', name: 'query', type: 'string', default: '', required: true, displayOptions: { show: { operation: ['findMember'] } } },
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const credentials = await this.getCredentials('hellotracksApi') as HellotracksCredentials;
		const inputItems = this.getInputData();
		const results: INodeExecutionData[] = [];
		for (let i = 0; i < inputItems.length; i++) {
			try {
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
					data = await request.call(this, credentials, 'POST', '/jobs', i, normalizeJobPayload(body));
				} else if (operation === 'updateJob') {
					data = await request.call(this, credentials, 'PATCH', '/jobs', i, {
						...normalizeJobPayload(body),
						id: this.getNodeParameter('id', i) as string,
					});
				} else if (operation === 'archiveJob') {
					const id = encodeURIComponent(this.getNodeParameter('id', i) as string);
					data = await request.call(this, credentials, 'POST', `/jobs/${id}/archive`, i);
				} else if (operation === 'deleteJob') {
					const id = encodeURIComponent(this.getNodeParameter('id', i) as string);
					data = await request.call(this, credentials, 'DELETE', `/jobs/${id}`, i);
				} else if (operation === 'findJob') {
					data = await request.call(this, credentials, 'GET', `/jobs${encodeQuery({
						externalId: this.getNodeParameter('externalId', i) as string,
						includeArchived: true,
						limit: 1,
					})}`, i);
				} else {
					data = await request.call(this, credentials, 'GET', `/members${encodeQuery({
						query: this.getNodeParameter('query', i) as string,
						max: 50,
					})}`, i);
				}
				const items = Array.isArray(data.items) ? data.items : [data];
				for (const item of items) {
					results.push({ json: item, pairedItem: { item: i } });
				}
			} catch (error) {
				if (!this.continueOnFail()) {
					throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
				}
				results.push({
					json: { error: error instanceof Error ? error.message : String(error) },
					pairedItem: { item: i },
				});
			}
		}
		return [results];
	}
}
