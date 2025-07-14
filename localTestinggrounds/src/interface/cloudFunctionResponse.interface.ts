import { CloudFunctionResponseType } from "./enums";

export interface CloudFunctionResponse {
    success: boolean;
    message: string;
    type: CloudFunctionResponseType;
    data?: any; // Optional data field to return additional information
    error?: string; // Optional error field to return error messages
    }

