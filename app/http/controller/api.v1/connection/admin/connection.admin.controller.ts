import { Sender } from "../../../../services/sender.service";

export class Connection {
    async getFriends(req, res){
        try{
            
        } catch (error) {
            Sender.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
}
