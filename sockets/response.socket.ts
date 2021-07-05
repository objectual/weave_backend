import * as _ from "lodash";

export class ResponseSockets {
    private _socket
    constructor(socket) {
        this._socket = socket
    }

    error(msg, data) {
        return this._socket.emit('error', { text: msg, data, time: Date.now() });
    }

    message(msg, data) {
        return this._socket.emit('message', { text: msg, data, time: Date.now() });
    }

    locationUsers(msg, data){
        return this._socket.emit('location-users', { text: msg, data, time: Date.now() });
    }

}