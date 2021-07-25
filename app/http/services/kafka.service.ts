import { Kafka } from "kafkajs"
import { RedisService } from "../../cache/redis.service";
import { IUser, IUserProfile } from "../models/user.model";
import { UserService } from "./user.service";
import * as _ from "lodash"
const openpgp = require('openpgp');
import fs from "fs";
import path from "path";

interface IPresence {
    date: number,
    presence: string,
    pub: string
}

export class Messages {
    private message: string
    constructor(_message: string) {
        this.message = _message
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
    async getUserPresence(phone){
        return new Promise(async (resolve, reject)=>{ 
            let users = await RedisService.searchData(`${phone}|*|user`)
            let user;
            if (users.length > 0) {
                console.log("SENDING FROM REDIS")
                user = _.clone(users[0])
                let presence = await this.checkPresence(phone)
                user.presence = presence
                resolve(user);
            } else {
                user = await this.getUser(phone)
                if (user == null) {
                    resolve(null);
                } else {
                    let presence = await this.checkPresence(phone)
                    user.presence = presence
                    resolve(user);
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
                if (user == null || user.encryption == null) {
                    reject(null)
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
                reject(null)
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

    async getEncryptedMessages(to: IUserProfile['profile']['phoneNo'][]) {
        return new Promise(async (resolve, reject) => {
            resolve(await Promise.all(to.map(async phone => {
                console.log("HERE")
                let user =  await this.getUserPresence(phone)
                if (user != null) {
                    fs.writeFileSync(`config/cert/temp_keys/${phone}.pub`, user['presence'].pub, 'base64')
                    return `config/cert/temp_keys/${phone}.pub`
                }
            })).then(async keys => {
                let enc_message = await this.encryptStringWithPgpPublicKey(keys, 'config/cert/messagesPGP', this.message, process.env.PASSPHRASE)
                console.log('enc_message :', enc_message);
                
                return to.map(phone => {
                    return {
                        value: enc_message,
                        type: "INFO",
                        to: phone,
                        from: "SYSTEM"
                    }
                })
            }))
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

    producer(topic: string, data: any[]) {
        return new Promise(async (resolve, reject) => {
            try {
                const producer = this.kafka.producer()
                await producer.connect()
                const result = await producer.send({
                    topic: topic,
                    messages: data
                })
                console.log(`Sent ${JSON.stringify(result)}`)
                await producer.disconnect()
                resolve(result)
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