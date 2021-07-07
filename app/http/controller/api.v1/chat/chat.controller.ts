import { Request, Response } from "express"
import { Sender } from "../../../services/sender.service";

export class Chat {
    async get(req:Request, res:Response) {
        try{

        }
         catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async post(req:Request, res:Response) {
        try{

        }
         catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async patch(req:Request, res:Response) {
        try{

        }
         catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async delete(req:Request, res:Response) {
        try{

        }
         catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
}