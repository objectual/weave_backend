import compose from "composable-middleware";
import * as _ from "lodash";
import { createClient } from "redis";
const redisScan = require('node-redis-scan');
let client: any;
let scanner: any;
export class RedisService {
    connect_cache() {
        console.log("❗ Connecting to Redis...")
        return new Promise((resolve, reject) => {
            let origin = {}
            if (process.env.NODE_ENV == "production") {
                origin = {
                    port: process.env.REDIS_PORT, // replace with your port
                    host: process.env.REDIS_HOST, // replace with your hostanme or IP address
                    password: process.env.REDIS_PASS, // replace with your password
                }
            }
            client = createClient(origin);
            console.info("✔️ Redis Cache Connected");
            resolve(client);
        });
    };
    protected setUserStateToken(auth: string, exp: number) {
        return new Promise((resolve, reject) => {
            try {
                client.setex(`${auth}|token|expiry`, exp, JSON.stringify(auth));
                resolve(true);
            } catch (error) {
                reject(error.message);
            }
        });
    }
    protected getUserStateToken(auth) {
        return new Promise((resolve, reject) => {
            try {
                client.get(`${auth}|token|expiry`, (err, data) => {
                    if (err) throw err;
                    if (data !== null) {
                        resolve(data);
                    } else {
                        resolve(null);
                    }
                });
            } catch (error) {
                reject(error.message);
            }
        });
    };

    protected deleteUserStateToken(auth) {
        return new Promise((resolve, reject) => {
            try {
                client.del(`${auth}|token|expiry`, function (err, response) {
                    resolve(true);
                });
            } catch (error) {
                console.log("ERROR IN REDIS")
                reject(error.message);
            }
        });
    };
    protected searchData(pattern: string): Promise<any[]> {
        return new Promise(async (resolve, reject) => {
            try {
                scanner = new redisScan(client)
                scanner.scan(pattern, async (err, matchingKeys) => {
                    if (err) reject(err);
                    Promise.all(matchingKeys.map(key => {
                        return new Promise((resolve, reject) => {
                            try {
                                this.getData(`${key}`).then(data => {
                                    if (data !== null) {
                                        this.getData(`${key}|analytics|search`).then(analytic => {
                                            data["trend"] = analytic !== null ? _.toInteger(analytic) : 0;
                                            resolve(data);
                                        })
                                    } else {
                                        resolve(null);
                                    }
                                });
                            } catch (error) {
                                reject(error.message);
                            }
                        });
                    })).then(data => {
                        resolve(_.reverse(_.sortBy(data, [function (o) { return o.trend }])))
                    })
                });
            } catch (error) {
                reject(error.message);
            }
        });
    }
    protected setData(data: any, key: string, exp: number = 3600) {
        return new Promise((resolve, reject) => {
            try {
                if (exp == 0) {
                    client.setex(`${key}`, 48 * 60 * 60 * 1000, JSON.stringify(data)); //2 day record
                } else {
                    client.setex(`${key}`, exp, JSON.stringify(data));
                }
                resolve(true);
            } catch (error) {
                reject(error.message);
            }
        });
    }
    protected getData(key: string): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                client.get(`${key}`, (err, data) => {
                    if (err) throw err;
                    if (data !== null) {
                        resolve(JSON.parse(data));
                    } else {
                        resolve(null);
                    }
                });
            } catch (error) {
                reject(error.message);
            }
        });
    };
    protected async getRedisKeys() {
        return new Promise((resolve, reject) => {
            try {
                client.keys("*", (err, keys) => {
                    let count = _.filter(keys, (o) => {
                        return o.split("|")[0] == "count";
                    });
                    if (err) reject({ success: false, message: err });
                    resolve({ count });
                });
            } catch (error) {
                reject({ success: false, message: error.message });
            }
        });
    };
    protected async deleteRedisKeys() {
        return new Promise((resolve, reject) => {
            try {
                client.flushdb((err, succeeded) => {
                    if (err) reject({ success: false, message: err });
                    resolve({ message: "Keys Deleted", success: true });
                });
            } catch (error) {
                reject({ success: false, message: error.message });
            }
        });
    };
    protected async searchAndDeleteKeys(keyword) {
        return new Promise((resolve, reject) => {
            try {
                let key = "*" + keyword + "*";

                client.keys(key, (err, keys) => {
                    keys.forEach((k) => {
                        client.del(k, (err, response) => {
                            console.log(`${key} keys deleted`);
                            resolve(true);
                        });
                    });
                });
            } catch (error) {
                reject({ success: false, message: error.message });
            }
        });
    };
}