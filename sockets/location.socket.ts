import * as _ from "lodash";
export class LocationSockets {
    private _socket
    constructor(socket) {
        this._socket = socket
    }

    get routes() {
        this._socket.on("location-update", (data, callback) => { 
            let { user_id, lat, long } = data // Need to fix this 
            this._socket.emit('message', { text: `Location updated`, data: { user_id, lat, long }, time: Date.now() });
            callback();
        })
        return this._socket
    }
}