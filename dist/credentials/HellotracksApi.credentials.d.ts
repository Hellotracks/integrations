import type { ICredentialType, INodeProperties } from 'n8n-workflow';
export declare class HellotracksApi implements ICredentialType {
    name: string;
    displayName: string;
    icon: "file:../nodes/Hellotracks/hellotracks.svg";
    documentationUrl: string;
    test: {
        request: {
            method: "GET";
            url: string;
            headers: {
                'API-Key': string;
                Accept: string;
            };
        };
    };
    properties: INodeProperties[];
}
