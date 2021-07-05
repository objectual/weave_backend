import { Sender } from "../../../../services/sender.service";
import { Request, Response } from "express"

export class Events {
    getEvents(req:Request, res:Response){
        try{
            
        }catch(e){
            Sender.errorSend(res, {success: false, msg: e.message, status: 500})
        }
    }
    
    updateEvent(req:Request, res:Response){
        try{

        }catch(e){
            Sender.errorSend(res, {success: false, msg: e.message, status: 500})
        }
    }
    
    deleteEvent(req:Request, res:Response){
        try{

        }catch(e){
            Sender.errorSend(res, {success: false, msg: e.message, status: 500})
        }
    }
}