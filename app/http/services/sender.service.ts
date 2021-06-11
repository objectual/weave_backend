interface ISender {
    errorSend: (res, data: ErrorObject) => {};
    send: (res, data: SuccessObject) => {}
}

interface ErrorObject {
    success: boolean;
    status: ErrorCodes;
    msg?: string;
    raw?: any;
    message?: string
}

interface SuccessObject {
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

export const Sender = new class Sender implements ISender {
    errorSend(res: any, data: ErrorObject) {
        console.error("ERROR", data)
        return res.status(data.status).send(data);
    }

    send(res: any, data: SuccessObject) {
        return res.status(data.status).send(data);
    }
}