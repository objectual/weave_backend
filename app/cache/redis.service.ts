import compose from "composable-middleware";
import * as _ from "lodash";
import { createClient } from "redis";
const redisScan = require('node-redis-scan');
let client: any;
let scanner: any;
export const RedisService = new class RedisService {
    connectCache() {
        // console.log("❗ Service Connecting to Redis...")
        let origin = {
            host: process.env.REDIS_HOST, // replace with your hostanme or IP address
            password: process.env.REDIS_PASS, // replace with your password
        }
        // if (process.env.NODE_ENV == "production") { // ONLY USE IN PRODUCTION READY ENVIRONMENT

        // REDIS_HOST=redis-14496.c81.us-east-1-2.ec2.cloud.redislabs.com
        // REDIS_PORT=14496
        // REDIS_PASS=5ltxkq576jCw8nuhCKWWlwZCIOxam1NS
        //     origin = {
        //         port: process.env.REDIS_PORT, // replace with your port
        //         host: process.env.REDIS_HOST, // replace with your hostanme or IP address
        //         password: process.env.REDIS_PASS, // replace with your password
        //     }
        // }
        return createClient(origin);
    };
    constructor() {
        client = this.connectCache()
        console.info(`✔️ Service Connected to Redis`);
        client.on("error", function (error) {
            console.error("❗ ", error);
            process.exit(1)
        });
    }
    setUserStateToken(auth: string, exp: number) {
        return new Promise((resolve, reject) => {
            try {
                client.setex(`${auth}|token|expiry`, exp, JSON.stringify(auth));
                resolve(true);
            } catch (error) {
                reject(error.message);
            }
        });
    }
    getUserStateToken(auth) {
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

    deleteUserStateToken(auth) {
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

    searchData(pattern: string): Promise<any[]> {
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
                                        // Get the ID from phone|first name|last name|id|user
                                        let id = key.split("|")[3];
                                        let type = key.split("|")[4];
                                        this.getData(`${id}|${type}|analytics|search`).then(analytic => {
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

    searchLocationKeys(pattern: string): Promise<any[]> {
        return new Promise(async (resolve, reject) => {
            try {
                scanner = new redisScan(client)
                scanner.scan(pattern, async (err, matchingKeys) => {
                    if (err) {
                        reject(err)
                    }
                    resolve(matchingKeys);
                });
            } catch (e) {
                reject(e.message);
            }
        })
    }

    setData(data: any, key: string, exp: number = 3600) {
        return new Promise((resolve, reject) => {
            try {
                if (exp == 0) {
                    client.setex(`${key.toLowerCase()}`, 72 * 60 * 60 * 1000, JSON.stringify(data)); //3 day record
                } else {
                    client.setex(`${key.toLowerCase()}`, exp, JSON.stringify(data));
                }
                resolve(true);
            } catch (error) {
                reject(error.message);
            }
        });
    }

    getData(key: string): Promise<any> {
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

    async getRedisKeys() {
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

    async deleteRedisKeys() {
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

    async searchAndDeleteKeys(keyword) {
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