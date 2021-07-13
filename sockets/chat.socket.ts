import * as _ from "lodash";
import { Kafka } from "kafkajs"

import { RedisService } from "../app/cache/redis.service";
import { UserService } from "../app/http/services/user.service";
import { ISocketUserLocation, ResponseSockets } from "./response.socket";
export class ChatSockets {
    private _socket
    private _consumer

    constructor(socket, consumer) {
        this._socket = socket
        this._consumer = consumer

    }

    async observer(topic: string, id: string) {
        await this._consumer.subscribe({
            topic: topic,
            fromBeginning: true
        })
        console.log("Consumer started for: ", topic, id)
        await this._consumer.run({
            eachMessage: async result => {
                console.log(`RVD IN CONSUMER SOCKET msg: ${result.message.value} on partition ${result.partition}`)
                this._socket.emit("consumer", result)
            }
        })
    }
    get routes() {
        this.observer(this._socket['user'].profile.phoneNo, this._socket['user'].profile.userId)
        
        return this._socket
    }
}