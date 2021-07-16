import express from 'express';
import { Chat } from './chat.controller';
const router = express.Router();


class ChatRoutes {
    get routes() {
        // Gets my active chat rooms
        router.get("/", new Chat().get);

        // Creates a new chat room
        router.post("/", new Chat().post);

        // Update details of room
        router.patch("/", new Chat().patch);

        // Delete room
        router.delete("/", new Chat().delete);
        return router
    }
}

Object.seal(ChatRoutes);
export default ChatRoutes;