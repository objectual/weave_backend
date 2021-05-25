'use strict';

export interface ErrorObject {
    success: boolean;
    msg?: string;
    status?: number;
    raw?: any;
    message?: string
}

export class ErrorService {
    public static handler(res: any, status: number, data: ErrorObject) {
        console.error(data)
        return res.status(status).send(data);
    }
}