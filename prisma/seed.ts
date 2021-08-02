import { PrismaClient } from '@prisma/client'
import { Kafka } from "kafkajs"
const prisma = new PrismaClient()
const kafka = new Kafka({
    clientId: "messageservice",
    brokers: [`${process.env.IP}:29092`]
})
const admin = kafka.admin()
admin.connect()
console.log(`Kafka connecting on : `,`${process.env.IP}:29092`)
async function main() {
    const Weave_Admin = await prisma.user.upsert({
        where: { id: "e6895e69-bb65-4f92-8989-6aae24defc86" },
        update: {},
        create: {
            "id": "e6895e69-bb65-4f92-8989-6aae24defc86",
            "email": null,
            "blocked": false,
            "role": "ADMIN",
            "profile": {
                "create": {
                    "phoneNo": "447752581599",
                    "firstName": "Weave",
                    "lastName": "Moderator",
                    "city": "london",
                    "country": "uk",
                    "approved": true,
                    "birthday": "1990-01-18T19:00:00.000Z",
                    "birthYearVisibility": true,
                    "about": "Hey!",
                    "locationRange": 200,
                    "locationVisibility": true
                }
            },
        },
        include: { profile: true },
    })

    await admin.createTopics({
        topics: [{
            topic: "447752581599",
            numPartitions: 2
        }]
    }).then(() => {
        console.log("TOPICS CREATED .... ", "447752581599")
    })

    const Hannah_Olive = await prisma.user.upsert({
        where: { id: "e031e3b2-bd0d-455a-b08a-3a21271be74e" },
        update: {},
        create: {
            "id": "e031e3b2-bd0d-455a-b08a-3a21271be74e",
            "email": null,
            "blocked": false,
            "role": "USER",
            "profile": {
                "create": {
                    "phoneNo": "923342481099",
                    "firstName": "Hannah",
                    "lastName": "Olive",
                    "city": "london",
                    "country": "uk",
                    "birthday": "1990-01-18T19:00:00.000Z",
                    "birthYearVisibility": true,
                    "approved": true,
                    "about": "World is round",
                    "locationRange": 200,
                    "locationVisibility": true,
                }
            }
        },
        include: { profile: true },
    })

    await admin.createTopics({
        topics: [{
            topic: "923342481099",
            numPartitions: 2
        }]
    })
    console.log("TOPICS CREATED .... ", "923342481099")

    const Suzy_Adams = await prisma.user.upsert({
        where: { id: "9b4b4f2c-7748-4214-8708-96ba9ab30957" },
        update: {},
        create: {
            "id": "9b4b4f2c-7748-4214-8708-96ba9ab30957",
            "email": null,
            "role": "USER",
            "blocked": false,
            "profile": {
                "create": {
                    "phoneNo": "923343664550",
                    "firstName": "Suzy",
                    "lastName": "Adams",
                    "city": "london",
                    "country": "uk",
                    "approved": true,
                    "birthday": "1990-01-18T19:00:00.000Z",
                    "birthYearVisibility": true,
                    "about": "Smarter than the world",
                    "locationRange": 200,
                    "locationVisibility": true
                }
            }
        },
        include: { profile: true },
    })

    await admin.createTopics({
        topics: [{
            topic: "923343664550",
            numPartitions: 2
        }]
    }).then(() => {
        console.log("TOPICS CREATED .... ", "923343664550")
    })

    const Jimmy_Harper = await prisma.user.upsert({
        where: { id: "378e5609-1ad7-44e2-acf2-be1cb4028a4a" },
        update: {},
        create: {
            "id": "378e5609-1ad7-44e2-acf2-be1cb4028a4a",
            "email": null,
            "blocked": false,
            "role": "USER",
            "profile": {
                "create": {
                    "phoneNo": "923323070980",
                    "firstName": "Jimmy",
                    "lastName": "Harper",
                    "city": "london",
                    "country": "uk",
                    "birthday": "1990-04-29T19:00:00.000Z",
                    "birthYearVisibility": true,
                    "approved": true,
                    "about": "Whats the word",
                    "profileImage": "http://localhost:8000/resources/cloudinary/images/378e5609-1ad7-44e2-acf2-be1cb4028a4a/2021-06-23T15-20-02.311Z-sydney-wallpaper",
                    "locationRange": 200,
                    "locationVisibility": true,
                }
            },
        },
        include: { profile: true },
    })

    await admin.createTopics({
        topics: [{
            topic: "923323070980",
            numPartitions: 2
        }]
    }).then(() => {
        console.log("TOPICS CREATED .... ", "923323070980")
    })

    console.log("Users Created: ", { Weave_Admin, Suzy_Adams, Hannah_Olive, Jimmy_Harper })
    await admin.disconnect()

    const Jimmy_Harper_Connect_Suzy_Adams = await prisma.friends.upsert({
        where: { id: "8497dc70-f1c7-4b7f-922f-4c7ca47444c3" },
        update: {},
        create: {
            "id": "8497dc70-f1c7-4b7f-922f-4c7ca47444c3",
            "userId": "378e5609-1ad7-44e2-acf2-be1cb4028a4a",
            "friendId": "9b4b4f2c-7748-4214-8708-96ba9ab30957",
            "approved": true,
            "createdAt": "2021-06-25T12:20:25.799Z",
            "updatedAt": "2021-06-25T12:20:25.800Z"
        },
        include: { user: true, friend: true },
    })
    const Hannah_Olive_Connect_Suzy_Adams = await prisma.friends.upsert({
        where: { id: "17dac59e-c611-4c18-a137-c25c18cf61dd" },
        update: {},
        create: {
            "id": "17dac59e-c611-4c18-a137-c25c18cf61dd",
            "userId": "e031e3b2-bd0d-455a-b08a-3a21271be74e",
            "friendId": "9b4b4f2c-7748-4214-8708-96ba9ab30957",
            "approved": true,
            "createdAt": "2021-06-25T12:20:25.799Z",
            "updatedAt": "2021-06-25T12:20:25.800Z"
        },
        include: { user: true, friend: true },
    })

    const Hannah_Olive_Blocks_Jimmy_Harper = await prisma.blockedList.upsert({
        where: { id: "3ac71834-45a6-46fc-8985-60709bcd8c5a" },
        update: {},
        create: {
            "id": "3ac71834-45a6-46fc-8985-60709bcd8c5a",
            "userId": "e031e3b2-bd0d-455a-b08a-3a21271be74e",
            "blockedId": "378e5609-1ad7-44e2-acf2-be1cb4028a4a",
            "createdAt": "2021-06-25T12:20:25.799Z",
        },
        include: { user: true, blocked: true },
    })
    console.log("Connections Created", `Jimmy -> Suzy <- Hannah -x> Jimmy`, { Jimmy_Harper_Connect_Suzy_Adams, Hannah_Olive_Connect_Suzy_Adams, Hannah_Olive_Blocks_Jimmy_Harper })


    let event_location = {
        address: "W3C6+F3 Gulberg Town, Karachi, Pakistan",
        lat: 24.921211,
        long: 67.060162,
    }
    let event_body = {
        id: "a0f4e2cb-a5ea-4399-aba2-c58a8479bd44",
        title: "The Big Fight",
        description: "The biggest event in London",
        from: new Date("2021-07-15T12:00+05:00"),
        to: new Date("2021-07-15T16:00+05:00"),
        location: { connectOrCreate: { create: event_location, where: { lat_long: { lat: event_location.lat, long: event_location.long } } } },
        owner: { connect: { id: "9b4b4f2c-7748-4214-8708-96ba9ab30957" } },
        members: {
            connect: [
                { id: "e031e3b2-bd0d-455a-b08a-3a21271be74e" },
                { id: "378e5609-1ad7-44e2-acf2-be1cb4028a4a" }
            ]
        }
    }
    const Hannah_Olive_Suzy_Adams_Jimmy_Harper_Event = await prisma.event.upsert({
        where: { id: "a0f4e2cb-a5ea-4399-aba2-c58a8479bd44" },
        update: {},
        create: event_body,
        include: { owner: true, members: true, location: true },
    })
    console.log("Event created: ", Hannah_Olive_Suzy_Adams_Jimmy_Harper_Event)

    const Suzy_Friends_Create_Chat_Room = await prisma.room.upsert({
        where: { id: "4c48845e-678b-4a6c-8033-8f0baac2ddf9" },
        update: {},
        create: {
            "name": "Friends",
            "description": "Just us friends forever",
            "owner": { "connect": { "id": "9b4b4f2c-7748-4214-8708-96ba9ab30957" } },
            "admins": {
                "connect": [
                    { "id": "e031e3b2-bd0d-455a-b08a-3a21271be74e" }]
            },
            "members": {
                "connect": [
                    { "id": "e031e3b2-bd0d-455a-b08a-3a21271be74e" }, { "id": "378e5609-1ad7-44e2-acf2-be1cb4028a4a" }]
            },
            "image": {
                "create": {
                    "type": "CHAT",
                    "cloudinaryId": "DEFAULT",
                    "path": "https://res.cloudinary.com/weavemasology/image/upload/v1627207902/images/customers-icon-29_c00nge.png"
                }
            }
        },
        include: { image: true, owner: true, members: true }
    })
    console.log('Suzy Create Friends Chat Room :', Suzy_Friends_Create_Chat_Room);

}
main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })