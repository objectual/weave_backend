import * as _ from "lodash";
import { IMessage } from "./chat.socket";
interface ISocketEmit {
    text: string,
    message?: IMessage
    data?: {
        user: Object | string,
        users?: ISocketUserLocation[],
        blockedByMe?: string[],
        blockedByOthers?: string[],
        lat?: number,
        long?: number
    }
}
export interface ISocketUserLocation {
    location: {
        id: string,
        locationVisibility: boolean,
        range: number,
        lat: number,
        long: number
    },
    distance: number,
    data: Object
}
export class ResponseSockets {
    private _socket
    constructor(socket) {
        this._socket = socket
    }

    private emit(emitter, obj: ISocketEmit) { 
        return this._socket.emit(emitter, { ...obj, time: Date.now() })
    }

    error(msg: ISocketEmit['text'], data: ISocketEmit['data']) {
        console.log("SENDING ERROR", { text: msg, data })
        return this.emit("error", { text: msg, data });
    }

    message(msg: ISocketEmit['text'], data: ISocketEmit['message']) {
        return this.emit("message", { text: msg, message: data });
    }

    info(msg: ISocketEmit['text'], data: ISocketEmit['data']) {
        return this.emit("info", { text: msg, data });
    }

    authorized(msg: ISocketEmit['text'], data: ISocketEmit['data']) {
        return this.emit("authorized", { text: msg, data });
    }

    locationUsers(msg: ISocketEmit['text'], data: ISocketEmit['data']) {
        return this.emit("location-users", { text: msg, data });
    }

}