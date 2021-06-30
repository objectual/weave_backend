import { Server } from "socket.io";
import fs from "fs";
const socketioJwt = require('socketio-jwt');
const publicKEY = fs.readFileSync("config/cert/accessToken.pub", "utf8");
import { LocationSockets } from "./sockets/location.socket";
import { UserService } from "./app/http/services/user.service";

module.exports = function (server) {
    const io = new Server(server)

    console.log("✔️ Socket Server Listening")

    io.use(socketioJwt.authorize({
        secret: publicKEY,
        handshake: true
    }));

    io.on('connect', async (socket) => {
        //this socket is authenticated, we are good to handle more events from it.
        const userService = new UserService()
        let user = await userService.findOneAdmin({ id: socket['decoded_token'].id, blocked: false })
        console.log(`connected: ${user.profile.firstName} ${user.profile.lastName}`, socket.id)
        socket.emit('message', { text: `Welcome to iωeave, ${user.profile.firstName} ${user.profile.lastName}`, time: Date.now() });

        new LocationSockets(socket).routes

        socket.on('disconnect', () => {
            console.log(`disconnected: ${user.profile.firstName} ${user.profile.lastName}`, socket.id)
        })

        socket.on("unauthorized", function (error) {
            console.log(error)
            // this should now fire
            if (error.data.type == "UnauthorizedError" || error.data.code == "invalid_token") {
                console.log("Unauthorized access");
                process.exit(1)
            }
        });
    });
}