"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HellotracksApi = void 0;
class HellotracksApi {
    constructor() {
        this.name = 'hellotracksApi';
        this.displayName = 'Hellotracks API';
        this.icon = 'file:../nodes/Hellotracks/hellotracks.svg';
        this.documentationUrl = 'https://api-docs.hellotracks.com';
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    'API-Key': '={{$credentials.apiKey}}',
                    Accept: 'application/json',
                },
            },
        };
        this.test = {
            request: {
                method: 'GET',
                baseURL: 'https://api.hellotracks.com/v1',
                url: '/auth/whoami',
            },
        };
        this.properties = [
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
}
exports.HellotracksApi = HellotracksApi;
