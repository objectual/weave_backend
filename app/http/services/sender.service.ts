export interface ErrorObject {
    success: boolean;
    status: number;
    msg?: string;
    raw?: any;
    message?: string
}

export interface SuccessObject {
    success: boolean;
    status: number;
    msg?: string;
    data?: any;
    message?: string;
    pages?: number;
    page?: number;
    count?: number;
}

export class SenderService {
    public static errorSend(res: any, data: ErrorObject) {
        console.error(data)
        return res.status(data.status).send(data);
    }

    public static send(res: any, data: SuccessObject) {
        console.info(data)
        return res.status(200).send(data);
    }
}