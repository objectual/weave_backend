import compose from "composable-middleware";
import * as _ from "lodash";
import { RedisService } from "../../cache/redis.service";
import { Sender } from "../services/sender.service";
export const CacheMiddleware = new class CacheMiddleware {
    userSearch() {
        return (
            compose()
                // Attach user to request
                .use((req, res, next) => {
                    let { id, key } = req.query;
                    if (id != null && id != "" && id != undefined) {
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
                        RedisService.searchData(`*${key}*|user`).then(users => {
                            if (users.length > 0) {
                                Sender.send(res, {
                                    status: 200,
                                    success: true,
                                    data: users,
                                    page: null,
                                    pages: null,
                                    count: users.length
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