import { FriendsService } from "../../../services/connection.service";
import { SenderService } from "../../../services/sender.service";

export class Connection {
    async getFriends(req, res) {
        try {
            let body = {
                userId: req.user.id,
                friendId: req.body.friend,
                approved: false,
            }
            const friendsService = new FriendsService();
            let request = await friendsService.create(body);
            SenderService.send(res, {success: true, data: request, status: 201})
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
