import { Server } from "socket.io";
import fs from "fs";
const socketioJwt = require('socketio-jwt');
const publicKEY = fs.readFileSync("config/cert/accessToken.pub", "utf8");
import { LocationSockets } from "./sockets/location.socket";
import { ResponseSockets } from "./sockets/response.socket";
import { userBlockedListConfigure, userConfigure } from "./sockets/sockets.conf";

module.exports = function (server) {
    const io = new Server(server)

    console.log("✔️ Socket Server Listening")

    io.use(socketioJwt.authorize({
        secret: publicKEY,
        handshake: true
    }));

    io.on('connect', async (socket) => {
        socket['user'] = await userConfigure(socket).catch(msg => new ResponseSockets(socket).error(msg, null))
        const { blockedByMe, blockedByOthers } = await userBlockedListConfigure(socket).catch(msg => new ResponseSockets(socket).error(msg, null))
        socket['blockedByMe'] = blockedByMe
        socket['blockedByOthers'] = blockedByOthers

        console.log(`connected: ${socket['user'].profile.firstName} ${socket['user'].profile.lastName}`, socket.id)

        socket.emit('authorized', { text: `Welcome to iωeave, ${socket['user'].profile.firstName} ${socket['user'].profile.lastName}`, data: { 
            handshake: true, user: socket['user'], blockedByMe:socket['blockedByMe'], blockedByOthers:socket['blockedByOthers'] 
        }, time: Date.now() });

        //Initializing Location Routes
        new LocationSockets(socket).routes

        socket.on('disconnect', () => {
            console.log(`disconnected: ${socket['user'].profile.firstName} ${socket['user'].profile.lastName}`, socket.id)
        })
    });
}