import * as _ from "lodash";
import { RedisService } from "../app/cache/redis.service";
import { ResponseSockets } from "./response.socket";
export class LocationSockets {
    private _socket
    constructor(socket) {
        this._socket = socket
    }

    get routes() {
        this._socket.on("location-update", (data, callback) => {
            let { user_id, lat, long } = data
            RedisService.setData({ lat, long, range: this._socket['user'].profile.locationRange }, `${user_id}|location`, 0)
            new ResponseSockets(this._socket).message(`Location updated`, { user: user_id, lat, long })
            callback();
        })

        this._socket.on('location-users', async (data, callback) => {
            let { user_id } = data
            let userLocations = await RedisService.searchLocationKeys(`*|location`)
            console.log(await this.getLocationData(userLocations))
            //THINGS TODO
            /*
            1. Nearby find algorithm
            2. Filter users not in their visibility range
            3. Update nearby data
            */
            // new ResponseSockets(this._socket).message("Nearby Users", { user: this._socket['user'] })
            callback();
        })
        return this._socket
    }

    private getLocationData(keys: string[]) {
        return new Promise((resolve, reject) => {
            let data = []
            Promise.all(keys.map(async key => {
                data.push(await RedisService.getData(key).catch(e => reject(e)))
            })).then(() => {
                resolve(data)
            })
        })
    }
}