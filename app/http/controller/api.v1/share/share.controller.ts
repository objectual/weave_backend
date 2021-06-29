import { Request, Response } from "express"
import { Sender } from "../../../services/sender.service"
import { UserService } from "../../../services/user.service"
export class Share {
    async user(req: Request, res: Response) {
        try {
            const userService = new UserService()
            let user = await userService.findOne({id: req.params.id})
        } catch (e) {
            Sender.errorSend(res, { success: false, msg: e.message, status: 500 })
        }
    }
    async event(req: Request, res: Response) {
        try {

        } catch (e) {
            Sender.errorSend(res, { success: false, msg: e.message, status: 500 })
        }
    }
}