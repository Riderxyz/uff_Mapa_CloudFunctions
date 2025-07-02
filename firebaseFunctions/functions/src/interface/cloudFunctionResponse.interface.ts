export interface CloudFunctionResponse {
    success: boolean;
    message: string;
    data?: any; // Optional data field to return additional information
    error?: string; // Optional error field to return error messages
    }