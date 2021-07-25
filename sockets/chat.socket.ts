import * as _ from "lodash";
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from "../app/cache/redis.service";
import { IUserProfile } from "../app/http/models/user.model";
import { UserService } from "../app/http/services/user.service";
import { ResponseSockets } from "./response.socket";
export interface IMessage {
    id: string;
    group?: string; // ID of group chat room
    pid?: IMessage['id']; // Parent message ID for state messages
    to?: IUserProfile['profile']['phoneNo'];
    from: IUserProfile['profile']['phoneNo'];
    value: string | IMessageState | IUserPresence; // value can be either a message, a message state or a user presence
    type: IMessageType;
    createdAt: number;
}

interface IPresence {
    date: number,
    presence: string,
    pub: string
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

class Chat {
    private _consumer
    private _producer
    protected response: ResponseSockets
    constructor(consumer, producer) {
        this._consumer = consumer
        this._producer = producer

        this._producer.connect()
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

                // Check if message is stored in redis and remove if delivered | read state is received on pid message
                let data = JSON.parse(result.message.value.toString())
                RedisService.searchAndDeleteKeys(`${data.id}`)
                if (data.pid != null) {
                    RedisService.searchAndDeleteKeys(`${data.pid}`)
                }

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
    }

    async checkPresence(phone): Promise<IPresence> {
        return new Promise(async (resolve, reject) => {
            let presence = await RedisService.getData(`${phone}|presence`)

            if (presence != null) {
                // PRESENCE EITHER AWAY OR ONLINE 
                resolve(presence);
            } else {
                // PRESENCE OFFLINE
                let user = await this.getUser(phone)
                if (user == null || user.encryption == null) {
                    reject(null)
                } else {
                    presence = {
                        date: null,
                        presence: "OFFLINE",
                        pub: user.encryption.pub
                    }
                    this.updatePresenceRedis(user, "OFFLINE", null)
                    resolve(presence);
                }
            }
        })
    }

    async getUser(phone: number): Promise<IUserProfile> {
        return new Promise(async (resolve, reject) => {
            const userService = new UserService()
            const user = await userService.findOne({ profile: { phoneNo: phone }, blocked: false })
            if (user == null) {
                reject(null)
            } else {
                console.log("USER CALLED FROM DATABASE", phone)
                await RedisService.setData(user.profile, `${user.profile.phoneNo}|${user.profile.firstName}|${user.profile.lastName}|${user.profile.userId}|user`, 0)
                resolve(user);
            }
        })
    }

    async updatePresenceRedis(user: IUserProfile, presence: string, date: number = null): Promise<void> {
        RedisService.setData({ date, presence: presence, pub: user.encryption.pub }, `${user.profile.phoneNo}|presence`, 720 * 60 * 60 * 1000)
    }

}

export class ChatSockets extends Chat {
    private _socket
    constructor(socket, consumer, producer) {
        super(consumer, producer)

        this._socket = socket
        this.response = new ResponseSockets(this._socket)
    }

    get routes() {
        this.observer(this._socket['user'].profile.phoneNo, this._socket['user'].profile.userId)

        this._socket.on("message", async ({ topic, data }, callback) => {
            try {
                data = JSON.parse(data)

                data['id'] = uuidv4();
                data['createdAt'] = new Date().getTime() / 1000;

                let presence = await this.checkPresence(data.to)

                // Store message to store if user is not available
                if (presence.presence != "ONLINE") {
                    //Store message for 30 days
                    console.log("Setting message to store", data.id)
                    RedisService.setData(data, `${data.id}|${data.to}|${data.from}|message`, 720 * 60 * 60 * 1000)
                }

                this.publisher(topic, data)
                callback();

            } catch (error) {
                this.response.error("There was error in your request", null)
            }
        })

        this._socket.on("presence", async (phone, callback) => {
            try {
                // This is used to get the presence of other users 
                let users = await RedisService.searchData(`${phone}|*|user`)
                let user;
                if (users.length > 0) {
                    console.log("SENDING FROM REDIS")
                    user = _.clone(users[0])
                    let presence = await this.checkPresence(phone)
                    user['presence'] = presence
                    callback(user);
                } else {
                    user = await this.getUser(phone)
                    if (user == null) {
                        this.response.error("User not found", null)
                    } else {
                        let presence = await this.checkPresence(phone)
                        user['presence'] = presence
                        callback(user);
                    }
                }
            } catch (error) {
                this.response.error("There was error in your request", null)
            }
        })
        return this._socket
    }
}