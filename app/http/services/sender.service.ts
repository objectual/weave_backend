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
    raw?:any;
    message?: string;
    pages?: number;
    page?: number;
    count?: number;
}

export class SenderService {
    public static errorSend(res: any, data: ErrorObject) {
        console.error("ERROR",data)
        return res.status(data.status).send(data);
    }

    public static send(res: any, data: SuccessObject) {
        console.info("SENDING",data)
        return res.status(200).send(data);
    }
}