import { CloudFunctionResponse } from "../interface/cloudFunctionResponse.interface";

export const atualizandoStatus= async (): Promise<CloudFunctionResponse> => {
        const response: CloudFunctionResponse = {
      success: true,
      message: "✅ Status atualizados com sucesso. ✅",
    };
    return Promise.resolve(response);
}