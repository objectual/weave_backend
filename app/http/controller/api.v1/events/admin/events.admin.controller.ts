import { Sender } from "../../../../services/sender.service";

export class Events {
    getEvents(req, res){
        try{
            
        }catch(e){
            Sender.errorSend(res, {success: false, msg: e.messages, status: 500})
        }
    }
    
    updateEvent(req, res){
        try{

        }catch(e){
            Sender.errorSend(res, {success: false, msg: e.messages, status: 500})
        }
    }
    
    deleteEvent(req, res){
        try{

        }catch(e){
            Sender.errorSend(res, {success: false, msg: e.messages, status: 500})
        }
    }
}