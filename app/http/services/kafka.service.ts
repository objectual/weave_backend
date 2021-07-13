import { Kafka } from "kafkajs"

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