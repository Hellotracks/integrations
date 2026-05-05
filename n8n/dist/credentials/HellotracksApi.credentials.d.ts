import type { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';
export declare class HellotracksApi implements ICredentialType {
    name: string;
    displayName: string;
    icon: "file:../nodes/Hellotracks/hellotracks.svg";
    documentationUrl: string;
    authenticate: IAuthenticateGeneric;
    test: ICredentialTestRequest;
    properties: INodeProperties[];
}
