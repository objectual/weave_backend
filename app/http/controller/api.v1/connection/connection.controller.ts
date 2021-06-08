import { SenderService } from "../../../services/sender.service";

export class Connection {
    async getFriends(req, res) {
        try {
            
        } catch (error) {
            SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async sendFriendRequest(req, res) {
        try {

        } catch (error) {
            SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async updateFriendRequest(req, res) {
        try {

        } catch (error) {
            SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async deleteFriendRequest(req, res) {
        try {

        } catch (error) {
            SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async getBlockList(req, res) {
        try {

        } catch (error) {
            SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async blockUser(req, res) {
        try {

        } catch (error) {
            SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    } 
    async unblockUser(req, res) {
        try {

        } catch (error) {
            SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
}
