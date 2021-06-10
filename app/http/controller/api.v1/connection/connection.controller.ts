import { BlockedService, FriendsService } from "../../../services/connection.service";
import { SenderService } from "../../../services/sender.service";
import * as _ from "lodash";
export class Connection {
    async getFriends(req, res) {
        try {
            let limit = _.toInteger(req.query.limit);
            let page = _.toInteger(req.query.page);
            const friendsService = new FriendsService();
            let { friends, count } = await friendsService.findWithLimit({ userId: req.user.id, approved: true }, limit, page)
            SenderService.send(res, { success: true, data: friends, count, page, pages: Math.ceil(count / limit), status: 200 })
        } catch (error) {
            SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async getFriendRequests(req, res) {
        try {
            let limit = _.toInteger(req.query.limit);
            let page = _.toInteger(req.query.page);
            const friendsService = new FriendsService();
            let { friends, count } = await friendsService.findWithLimit({ friendId: req.user.id, approved: false }, limit, page)
            SenderService.send(res, { success: true, data: friends, count, page, pages: Math.ceil(count / limit), status: 200 })
        } catch (error) {
            SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async getFriendsPendingApproval(req, res) {
        try {
            let limit = _.toInteger(req.query.limit);
            let page = _.toInteger(req.query.page);
            const friendsService = new FriendsService();
            let { friends, count } = await friendsService.findWithLimit({ userId: req.user.id, approved: false }, limit, page)
            SenderService.send(res, { success: true, data: friends, count, page, pages: Math.ceil(count / limit), status: 200 })
        } catch (error) {
            SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async sendFriendRequest(req, res) {
        try {
            let body = {
                userId: req.user.id,
                friendId: req.body.friend,
                approved: false,
            }
            const friendsService = new FriendsService();
            let request = await friendsService.create(body);
            SenderService.send(res, { success: true, data: request, status: 201, msg: "Friend request sent" })
        } catch (error) {
            SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async updateFriendRequest(req, res) {
        try {
            const friendsService = new FriendsService();
            let getRequest = await friendsService.findOne({ id: req.params.id, userId: req.user.id })
            if (getRequest.approved == req.body.approved) {
                SenderService.errorSend(res, { success: false, status: 409, msg: "Action already taken" })
                return;
            }
            let updateRequest = await friendsService.findOneAndUpdate({ id: req.params.id, userId: req.user.id }, { approved: req.body.approved })
            SenderService.send(res, { success: true, status: 200, msg: "Friend request updated", data: updateRequest })
        } catch (error) {
            SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async deleteFriendRequest(req, res) {
        try {
            const friendService = new FriendsService();
            let deleteFriend = await friendService.delete({ id: req.params.id, userId: req.user.id })
            SenderService.send(res, { success: true, data: deleteFriend, msg: "Friend removed", status: 200 })
        } catch (error) {
            SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async getBlockList(req, res) {
        try {
            let limit = _.toInteger(req.query.limit);
            let page = _.toInteger(req.query.page);
            const blockedService = new BlockedService();
            let { blocked, count } = await blockedService.findWithLimit({ userId: req.user.id }, limit, page)
            SenderService.send(res, { success: true, data: blocked, count, page, pages: Math.ceil(count / limit), status: 200 })
        } catch (error) {
            SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async blockUser(req, res) {
        try {
            let body = {
                userId: req.user.id,
                blockedId: req.body.user,
                approved: false,
            }
            const friendService = new FriendsService();
            let orQuery = [
                { userId: req.user.id, friendId: req.body.user },
                { userId: req.body.user, friendId: req.user.id },
            ]
            let alreadyFriends = await friendService.find({ OR: orQuery })
            await friendService.delete({ id: { in: alreadyFriends.map(x => x.id) } })
            const blockedService = new BlockedService();
            let blocked = await blockedService.create(body);
            SenderService.send(res, { success: true, data: blocked, status: 201, msg: "User blocked" })
        } catch (error) {
            SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
    async unblockUser(req, res) {
        try {
            const blockedService = new BlockedService();
            let unblocked = await blockedService.delete({ id: req.params.id, userId: req.user.id })
            SenderService.send(res, { success: true, data: unblocked, msg: "User unblocked", status: 200 })
        } catch (error) {
            SenderService.errorSend(res, { success: false, msg: error.message, status: 500 });
        }
    }
}
