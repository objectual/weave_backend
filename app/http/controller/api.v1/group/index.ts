import express from 'express';
import { RoomValidationMiddleware } from '../../../validators/chat.validate';
import { Uploader } from "../../../../constants/uploader";
import { Group } from './group.controller';
import { Sender } from '../../../services/sender.service';
const router = express.Router();


class GroupRoutes {
    filesLimitValidate(req, res, next) {
        return req['files']['image'].length > 1 ? Sender.errorSend(res, { success: false, msg: "Cannot upload more than 1 image", status: 400 }) : next()
    }
    get routes() {
        // Gets my active chat rooms
        router.get("/", new Group().get);

        // Creates a new chat room
        router.post("/", RoomValidationMiddleware.validateRoomCreate(), new Group().post);

        // Update details of room
        router.patch("/:id", RoomValidationMiddleware.validateRoomUpdate(), new Group().patch);

        // Delete room
        router.delete("/:id", new Group().delete);

        router.delete("/leave/:id", new Group().leave);

        router.post('/image/uploader/:id', this.filesLimitValidate, Uploader.fields([{ name: "image" }]), new Group().uploader)

        // router.delete('/image/remove', new Group().imageRemove)

        // router.get('/image/:id', new Group().getImages)
        return router
    }
}

Object.seal(GroupRoutes);
export default GroupRoutes;