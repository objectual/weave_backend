"use strict";

import { RedisService } from "./redis.service";
import * as _  from 'lodash';
import { Request, Response } from "express"

export class Redis {
    async getKeys(req:Request, res:Response) {
        try {
            RedisService.getRedisKeys()
                .then((data) => {
                    res.json(data);
                })
                .catch((error) => res.json(error));
        } catch (error) {
            res.send({ success: false, message: error.message });
        }
    };
    async flushdb(req:Request, res:Response) {
        try {
            if (req.body.pass == null) {
                res.status(401).send({ success: false, message: "Missing credentials" })
                return;
            } else if (req.body.pass == process.env.REDIS_PASS) {
                RedisService.deleteRedisKeys()
                    .then((data) => {
                        res.json(data);
                    })
                    .catch((error) => res.json(error));
            } else {
                res.status(401).send({ success: false, message: "Invalid credentials" })
                return;
            }
        } catch (error) {
            res.send({ success: false, message: error.message });
        }
    };
    async flushAuth(req:Request, res:Response) {
        try {
    
            if (req.body.pass == null || req.body.key == null) {
                res.status(401).send({ success: false, message: "Missing credentials / key" })
                return;
            } else if (req.body.pass == process.env.REDIS_PASS) {
                RedisService.searchAndDeleteKeys(req.body.key)
                    .then((data) => {
                        res.json(data);
                    })
                    .catch((error) => res.json(error));
            } else {
                res.status(401).send({ success: false, message: "Invalid credentials" })
                return;
            }
        } catch (error) {
            res.send({ success: false, message: error.message });
        }
    };
} 
