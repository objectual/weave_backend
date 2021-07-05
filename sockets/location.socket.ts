import * as _ from "lodash";
import { RedisService } from "../app/cache/redis.service";
import { UserService } from "../app/http/services/user.service";
import { ResponseSockets } from "./response.socket";
export class LocationSockets {
    private _socket
    constructor(socket) {
        this._socket = socket
    }

    get routes() {
        this._socket.on("location-update", (data, callback) => {
            let { user_id, lat, long } = data
            RedisService.setData({ lat, long, range: this._socket['user'].profile.locationRange, locationVisibility: this._socket['user'].profile.locationVisibility }, `${user_id}|location`, 0)
            new ResponseSockets(this._socket).message(`Location updated`, { user: user_id, lat, long })
            callback();
        })

        this._socket.on('location-users', async (data, callback) => {
            let { user_id } = data
            let keysUserLocations = await RedisService.searchLocationKeys(`*|location`)
            let userLocations = await this.getLocationData(keysUserLocations)
            let myLocation = _.filter(userLocations, function (x) { return x.id == user_id })[0]
            //THINGS TODO
            /*
            1. Nearby find algorithm
            2. Filter users not in their visibility range
            3. Update nearby data
            */
            new ResponseSockets(this._socket).locationUsers("Nearby Users", { user: this._socket['user'], users: await this.getNearbyUsers(userLocations, myLocation.lat, myLocation.long) })
            callback();
        })
        return this._socket
    }

    private async getNearbyUsers(data, _lat, _long) {
        let distances = _.filter(data.map(({ lat, long, range, id, locationVisibility }) => {
            let distance = (lat1, lon1, lat2, lon2) => {
                var radlat1 = (Math.PI * lat1) / 180;
                var radlat2 = (Math.PI * lat2) / 180;
                var theta = lon1 - lon2;
                var radtheta = (Math.PI * theta) / 180;
                var dist =
                    Math.sin(radlat1) * Math.sin(radlat2) +
                    Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                if (dist > 1) {
                    dist = 1;
                }
                dist = Math.acos(dist);
                dist = (dist * 180) / Math.PI;
                dist = dist * 60 * 1.1515 * 1.609; // 1mile = 1.609km
                return Math.round(dist); //KM
            };
            console.log(distance(_lat, _long, lat, long), range, id)
            return { distance: distance(_lat, _long, lat, long), id: id, range, locationVisibility }
        }), function (o) {
            return (o.distance <= o.range && o.locationVisibility == true);
        });
        let userService = new UserService()
        return new Promise(async (resolve, reject) => {
            let user_data = await userService.find({ id: { in: distances.map(x => x.id) }, blocked: false, profile: { approved: true } })
            resolve(user_data.users.map(x => { return { location: _.filter(data, u => u.id == x.id)[0], data: x } }))
        })
    }

    private getLocationData(keys: string[]) {
        return new Promise((resolve, reject) => {
            let data = []
            Promise.all(keys.map(async key => {
                data.push({ ...await RedisService.getData(key).catch(e => reject(e)), id: key.split("|")[0] })
            })).then(() => {
                resolve(data)
            })
        })
    }
}