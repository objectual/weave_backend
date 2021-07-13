import { Server } from "socket.io";
import { Kafka } from "kafkajs"

import fs from "fs";
const socketioJwt = require('socketio-jwt');

import { createAdapter } from 'socket.io-redis';
import { RedisClient } from "redis";

const publicKEY = fs.readFileSync("config/cert/accessToken.pub", "utf8");
import { LocationSockets } from "./sockets/location.socket";
import { ResponseSockets } from "./sockets/response.socket";
import { userBlockedListConfigure, userConfigure } from "./sockets/sockets.conf";
import { ChatSockets } from "./sockets/chat.socket";

module.exports = function (server) {
    const io = new Server(server)
    const kafka = new Kafka({
        clientId: "messageservice",
        brokers: [`${process.env.IP}:29092`]
    })
    const pubClient = new RedisClient({});
    const subClient = pubClient.duplicate();

    io.adapter(createAdapter({ pubClient, subClient }));
    console.log("✔️ Socket Server Listening")

    io.use(socketioJwt.authorize({
        secret: publicKEY,
        handshake: true
    }));

    io.on('connect', async (socket) => {
        if (socket['decoded_token'].hasOwnProperty("exp") == false || Math.floor(new Date().getTime() / 1000) > socket['decoded_token'].exp) {
            new ResponseSockets(socket).error(`Session Expired`, null)
            socket.disconnect(true)
            return;
        } else {
            socket['user'] = await userConfigure(socket).catch(msg => new ResponseSockets(socket).error(msg, null))
            const { blockedByMe, blockedByOthers } = await userBlockedListConfigure(socket).catch(msg => new ResponseSockets(socket).error(msg, null))
            socket['blockedByMe'] = blockedByMe
            socket['blockedByOthers'] = blockedByOthers

            console.log(`connected: ${socket['user'].profile.firstName} ${socket['user'].profile.lastName}`, socket.id)

            new ResponseSockets(socket).authorized(`Welcome to iωeave, ${socket['user'].profile.firstName} ${socket['user'].profile.lastName}`,
                { handshake: true, user: socket['user'], blockedByMe: socket['blockedByMe'], blockedByOthers: socket['blockedByOthers'] });

            //Initializing Location Routes
            new LocationSockets(socket).routes

            //Initializing Chat Routes
            const consumer = kafka.consumer({ groupId: socket['user'].profile.userId })
            await consumer.connect()
            new ChatSockets(socket, consumer).routes

            socket.on('disconnect', async () => {
                await consumer.disconnect()
                console.log(`disconnected: ${socket['user'].profile.firstName} ${socket['user'].profile.lastName}`, socket.id)
            })
        }
    });
}