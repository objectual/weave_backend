const openpgp = require('openpgp');

import { Kafka } from "kafkajs"
import { RedisService } from "../../cache/redis.service";
import { IUser, IUserProfile } from "../models/user.model";
import { UserService } from "./user.service";
import * as _ from "lodash"
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from 'uuid';

export interface IMessage {
    id: string;
    group?: string; // ID of group chat room
    pid?: IMessage['id']; // Parent message ID for state messages
    to?: IUserProfile['profile']['phoneNo'];
    from: IUserProfile['profile']['phoneNo'];
    value: string | IMessageState | IUserPresence; // value can be either a message, a message state or a user presence
    type: IMessageType;
    createdAt: number;
}

export interface IPresence {
    date: number,
    presence: string,
    pub: string
}

enum IMessageType {
    media = "MEDIA", // used for media message URI
    info = "INFO", // used for user or system information
    text = "TEXT", // used for text messages
    state = "STATE", // used for notifying user message states
    presence = "PRESENCE" // used for notifying about user presence
}
enum IMessageState {
    deleted = "DELETED", // used for delete message for all users scenario
    liked = "LIKED", // used for liked message for all users scenario
    read = "READ",
    delivered = "DELIVERED",
    sent = "SENT"
}
enum IUserPresence {
    online = "ONLINE",
    offline = "OFFLINE",
    away = "AWAY"
}


export class Messages {
    private message: string
    private messages: Promise<IMessage[]>
    private gid: string
    constructor(_message?: string, to?: IUserProfile['id'][], _gid?: string)
    constructor(_message: string, to: IUserProfile['id'][], _gid: string) {
        this.message = _message
        this.gid = _gid
        this.messages = this.getEncryptedMessages(to, _gid).then(messages => messages)
    }
    get getMessages(): Promise<IMessage[]> {
        return this.messages
    }
    async encryptStringWithPgpPublicKey(relativeOrAbsolutePathToPublicKeys, myPrivateKeyPath, plaintext, passphrase) {
        console.log('relativeOrAbsolutePathToPublicKeys :', relativeOrAbsolutePathToPublicKeys);
        const encrypted = await openpgp.encrypt({
            message: await openpgp.createMessage({ text: plaintext }), // input as Message object
            encryptionKeys: await Promise.all(relativeOrAbsolutePathToPublicKeys.map(keyPath => path.resolve(keyPath)).map(async keyPath => {
                return await openpgp.readKey({ armoredKey: fs.readFileSync(keyPath, "utf8") });
            })).then(keys => {
                return keys
            }),
            signingKeys: await openpgp.decryptKey({
                privateKey: await openpgp.readPrivateKey({ armoredKey: fs.readFileSync(path.resolve(myPrivateKeyPath), "utf8") }),
                passphrase
            }) // optional - This is the key of user who signed this message. For signature verification
        });
        return Buffer.from(encrypted).toString("base64")
    }
    async getUserPresence(phone) {
        return new Promise(async (resolve, reject) => {
            let users = await RedisService.searchData(`${phone}|*|user`)
            let user;
            if (users.length > 0) {
                console.log("SENDING FROM REDIS")
                user = _.clone(users[0])
                let presence = await this.checkPresence(phone)
                if (presence == null) {
                    resolve(null);
                } else {
                    user.presence = presence
                    resolve(user);
                }
            } else {
                user = await this.getUser(phone)
                if (user == null) {
                    resolve(null);
                } else {
                    let presence = await this.checkPresence(phone)
                    if (presence == null) {
                        resolve(null);
                    } else {
                        user.presence = presence
                        resolve(user);
                    }
                }
            }
        })
    }
    async checkPresence(phone): Promise<IPresence> {
        return new Promise(async (resolve, reject) => {
            let presence = await RedisService.getData(`${phone}|presence`)

            if (presence != null) {
                // PRESENCE EITHER AWAY OR ONLINE 
                resolve(presence);
            } else {
                // PRESENCE OFFLINE
                let user = await this.getUser(phone)

                console.log(user.encryption)
                if (user == null || user.encryption == null) {
                    resolve(null)
                } else {
                    presence = {
                        date: null,
                        presence: "OFFLINE",
                        pub: user.encryption.pub
                    }
                    this.updatePresenceRedis(user, "OFFLINE", null)
                    resolve(presence);
                }
            }
        })
    }
    async getUser(phone: number): Promise<IUserProfile> {
        return new Promise(async (resolve, reject) => {
            const userService = new UserService()
            const user = await userService.findOne({ profile: { phoneNo: phone }, blocked: false })
            if (user == null) {
                resolve(null)
            } else {
                console.log("USER CALLED FROM DATABASE", phone)
                await RedisService.setData(user.profile, `${user.profile.phoneNo}|${user.profile.firstName}|${user.profile.lastName}|${user.profile.userId}|user`, 0)
                resolve(user);
            }
        })
    }

    async updatePresenceRedis(user: IUserProfile, presence: string, date: number = null): Promise<void> {
        RedisService.setData({ date, presence: presence, pub: user.encryption.pub }, `${user.profile.phoneNo}|presence`, 720 * 60 * 60 * 1000)
    }

    async getEncryptedMessages(to: IUserProfile['profile']['phoneNo'][], gid = null): Promise<IMessage[]> {
        return new Promise(async (resolve, reject) => {
            const userService = new UserService()
            let { users } = await userService.find({ id:  { in: to  }, blocked: false })
            if (users.length != 0) {
                let keys = users.map(u => {
                    if (u.encryption != null) {
                        return null
                    } else {
                        fs.writeFileSync(`config/cert/temp_keys/${u.profile.phoneNo}.pub`, u.encryption.pub, 'base64')
                        return `config/cert/temp_keys/${u.profile.phoneNo}.pub`
                    }
                })
                keys = _.reject(keys, k => k == null)
                let enc_message = await this.encryptStringWithPgpPublicKey(keys, 'config/cert/messagesPGP', this.message, process.env.PASSPHRASE)
                keys.forEach(k => fs.unlink(k, () => { }))
                return resolve(to.map(phone => {
                    return <IMessage>{
                        id: uuidv4(),
                        gid,
                        value: enc_message,
                        type: "INFO",
                        to: phone,
                        from: "SYSTEM",
                        createdAt: new Date().getTime() / 1000
                    }
                }))
            } else {
                reject("Users not found")
            }
        })
    }
}
export class KafkaService {
    private kafka: Kafka
    constructor() {
        this.kafka = new Kafka({
            clientId: "messageservice",
            brokers: [`${process.env.IP}:29092`]
        })
    }

    setTopic(topic: string) {
        return new Promise(async (resolve, reject) => {
            try {
                const admin = this.kafka.admin()
                await admin.connect()

                await admin.createTopics({
                    topics: [{
                        topic: topic,
                        numPartitions: 2
                    }]
                })
                console.log("TOPICS CREATED .... ", topic)
                await admin.disconnect()
                resolve(true)
            } catch (e) {
                reject(e)
            }
        })
    }

    producer(data: IMessage[]) {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(Promise.all(data.map(async message => {
                    try {
                        const producer = this.kafka.producer()
                        await producer.connect()
                        const result = await producer.send({
                            topic: message.to,
                            messages: [{
                                value: JSON.stringify(message),
                                partition: 1
                            }]
                        })
                        console.log(`Sent ${JSON.stringify(result)}`)
                        await producer.disconnect()
                        return result
                    } catch (pe) {
                        return pe
                    }
                })).then(results => {
                    return results
                }).catch(e => {
                    console.log('Caught a bug in the system :', e);
                    return e
                }))
            } catch (e) {
                reject(e)
            }
        })
    }

    async consumer(topic: string, id: string) {
        try {
            const consumer = this.kafka.consumer({ groupId: id })
            await consumer.connect()
            await consumer.subscribe({
                topic: topic,
                fromBeginning: true
            })
            let messages = []
            await consumer.run({
                eachMessage: async result => {
                    console.log(`RVD msg: ${result.message.value} on partition ${result.partition}`)
                    messages.push(result)
                }
            })
        } catch (e) {
            return e
        }
    }
}