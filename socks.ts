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
import { RedisService } from "./app/cache/redis.service";

module.exports = function (server) {
    const io = new Server(server, {
        cors: { origin: "*" }
    })
    const kafka = new Kafka({
        clientId: "messageservice",
        brokers: [`${process.env.IP}:29092`]
    })
    const pubClient = new RedisClient(
        {
            port: process.env.REDIS_PORT, // replace with your port
            host: process.env.REDIS_HOST, // replace with your hostanme or IP address
        }
    );
    const subClient = pubClient.duplicate();

    io.adapter(createAdapter({ pubClient, subClient }));
    console.log("✔️ Socket Server Listening")

    io.use(socketioJwt.authorize({
        secret: publicKEY,
        handshake: true
    }));

    io.on('connect', async (socket) => {
        console.log("Connected to socket");
        
        const response = new ResponseSockets(socket)
        if (socket['decoded_token'].hasOwnProperty("exp") == false || Math.floor(new Date().getTime() / 1000) > socket['decoded_token'].exp) {
            response.error(`Session Expired`, null)
            socket.disconnect(true)
            return;
        } else {
            socket['user'] = await userConfigure(socket).catch(msg => response.error(msg, null))
            const { blockedByMe, blockedByOthers } = await userBlockedListConfigure(socket).catch(msg => response.error(msg, null))
            socket['blockedByMe'] = blockedByMe
            socket['blockedByOthers'] = blockedByOthers

            console.log(`connected: ${socket['user'].profile.firstName} ${socket['user'].profile.lastName}`, socket.id)

            response.authorized(`Welcome to iωeave, ${socket['user'].profile.firstName} ${socket['user'].profile.lastName}`,
                { user: socket['user'], blockedByMe: socket['blockedByMe'], blockedByOthers: socket['blockedByOthers'] });

            // Presence is set at user socket join to ONLINE for 1 hour. If the socket dies, the presence is updated
            await RedisService.setData({ date: new Date().getTime() / 1000, presence: "ONLINE", pub: socket['user'].encryption.pub }, `${socket['user'].profile.phoneNo}|presence`, 1 * 60 * 60 * 1000)

            //Initializing Location Routes
            new LocationSockets(socket).routes

            //Initializing Chat Routes
            const consumer = kafka.consumer({ groupId: socket['user'].profile.userId })
            const producer = kafka.producer()
            new ChatSockets(socket, consumer, producer).routes

            socket.on('disconnect', async () => {
                await consumer.disconnect()
                await producer.disconnect()
                RedisService.setData({ date: new Date().getTime() / 1000, presence: "AWAY", pub: socket['user'].encryption.pub }, `${socket['user'].profile.phoneNo}|presence`, 720 * 60 * 60 * 1000)
                console.log(`disconnected: ${socket['user'].profile.firstName} ${socket['user'].profile.lastName}`, socket.id)
            })
        }
    });
}