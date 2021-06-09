export interface ErrorObject {
    success: boolean;
    status: ErrorCodes;
    msg?: string;
    raw?: any;
    message?: string
}

export interface SuccessObject {
    success: boolean;
    status: ErrorCodes;
    msg?: string;
    data?: any;
    raw?: any;
    message?: string;
    pages?: number;
    page?: number;
    count?: number;
}


enum ErrorCodes {
    success = 200,
    created = 201,
    badRequest = 400,
    unAuthorizedAccess = 401,
    conflict = 409,
    serverError = 500,
}

export class SenderService {
    public static errorSend(res: any, data: ErrorObject) {
        console.error("ERROR", data)
        return res.status(data.status).send(data);
    }

    public static send(res: any, data: SuccessObject) {
        return res.status(data.status).send(data);
    }
}