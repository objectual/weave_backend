import * as _ from "lodash";
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from "../app/cache/redis.service";
import { IUserProfile } from "../app/http/models/user.model";
import { UserService } from "../app/http/services/user.service";
import { ISocketUserLocation, ResponseSockets } from "./response.socket";
export interface IMessage {
    id: string;
    pid?: IMessage['id'];
    to?: IUserProfile['profile']['phoneNo'];
    from: IUserProfile['profile']['phoneNo'];
    value: string | IMessageState | IUserPresence;
    type: IMessageType;
    createdAt: number;
}

enum IMessageType {
    media = "MEDIA", // used for media message URI
    info = "INFO", // used for user or system information
    text = "TEXT", // used for text messages
    state = "STATE", // used for notifying user message states
    presence = "PRESENCE" // used for notifying about user presence
}
enum IMessageState {
    read = "READ",
    delivered = "DELIVERED",
    sent = "SENT"
}
enum IUserPresence {
    online = "ONLINE",
    offline = "OFFLINE",
    away = "AWAY"
}
export class ChatSockets {
    private _socket
    private _consumer
    private _producer
    private readonly response: ResponseSockets
    constructor(socket, consumer, producer) {
        this._socket = socket
        this._consumer = consumer
        this._producer = producer
        this.response = new ResponseSockets(this._socket)
    }

    async observer(topic: string, id: string) {
        await this._consumer.connect()
        await this._consumer.subscribe({
            topic: topic,
            fromBeginning: true
        })
        console.log("Consumer started for: ", topic, id)
        await this._consumer.run({
            eachMessage: async result => {
                this.response.message("message", result.message.value.toString())
            }
        })
    }

    async publisher(topic: string, data: IMessage) {
        const result = await this._producer.send({
            topic: topic,
            messages: [{
                value: JSON.stringify(data),
                partition: 1
            }]
        })
        console.log(`Sent ${JSON.stringify(result)}`)
        this.response.message("message", data)

        // this.response.message("Message Sent", )
        // this._socket.emit("sent-subscriber", result)
    }

    get routes() {
        this.observer(this._socket['user'].profile.phoneNo, this._socket['user'].profile.userId)

        this._producer.connect()
        this._socket.on("message", (topic: string, data: IMessage, callback) => {
            data['id'] = uuidv4();
            data['createdAt'] = new Date().getTime() / 1000;

            this.publisher(topic, data)
            callback();
        })

        this._socket.on("presence", async (phone, callback) => {
            // This is used to get the presence of other users
            let users = await RedisService.searchData(`${phone}|*|user`)
            let user;
            if (users.length > 0) {
                user = _.clone(users[0])
                user['presence'] = await RedisService.getData(`${phone}|presence`)
                callback(user);
            } else {
                const userService = new UserService()
                user = await userService.findOne({ profile: { phoneNo: phone }, blocked: false }).catch(msg => this.response.error(msg, null))
                if (user.length == 0 || user == null) {
                    this.response.error("User not found", null)
                } else {
                    await RedisService.setData(user.profile, `${user.profile.phoneNo}|${user.profile.firstName}|${user.profile.lastName}|${user.userId}|user`, 0)

                    user['presence'] = await RedisService.getData(`${phone}|presence`)
                    callback(user);
                }
            }
        })
        return this._socket
    }
}