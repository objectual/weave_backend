import compose from "composable-middleware";
import * as _ from "lodash";
import { RedisService } from "../../cache/redis.service";
import { Sender } from "../services/sender.service";
import { Request, Response } from "express"

export const CacheMiddleware = new class CacheMiddleware {
    userSearch() {
        return (
            compose()
                // Attach user to request
                .use((req: Request, res: Response, next) => {
                    let { id, key } = <{ id: string, key: string }>req.query;
                    if (id != null && id != "" && id != undefined) {
                        // Check if I blocked of the other user blocked
                        let checkInMyList = _.indexOf(req['user'].data.blockedByMe, id)
                        let checkInOthersList = _.indexOf(req['user'].data.blockedByOthers, id)
                        if (checkInMyList == -1 || checkInOthersList == -1) {
                            // Found a blocked user
                            Sender.errorSend(res, { success: false, msg: "User not found", status: 400 })
                            return;
                        }
                        // Update user trend +1;
                        RedisService.getData(`${id}|user|analytics|search`).then(data =>
                            RedisService.setData(data !== null ? _.toInteger(data) + 1 : 1, `${id}|user|analytics|search`, 86400).catch((error) => { throw error })
                        )
                        RedisService.searchData(`*${id}|user`).then(users => {
                            if (users.length > 0) {
                                Sender.send(res, {
                                    success: true, data: users[0], status: 200,
                                })
                            } else {
                                next()
                            }
                        }).catch((error) => {
                            Sender.errorSend(res, { status: 500, success: false, msg: error.message });
                        })
                    } else if (key != null && key != "" && key != undefined) {
                        RedisService.searchData(`*${key.toLowerCase()}*|user`).then(users => {
                            if (users.length > 0) {
                                users = _.filter(users, x => {
                                    let checkInMyList = _.indexOf(req['user'].data.blockedByMe, x.userId)
                                    let checkInOthersList = _.indexOf(req['user'].data.blockedByOthers, x.userId)
                                    if (checkInMyList == -1 && checkInOthersList == -1) {
                                        // Didn't find a blocked user
                                        return x;
                                    }
                                })
                                Sender.send(res, {
                                    status: 200,
                                    success: true,
                                    data: users,
                                    page: null,
                                    pages: null,
                                    count: users.length,
                                    raw: "cached"
                                })
                            } else {
                                next()
                            }
                        }).catch((error) => {
                            Sender.errorSend(res, { status: 500, success: false, msg: error.message });
                        })
                    } else {
                        next();
                    }
                })
        )
    }
}