import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

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
                    "phoneNo": "923323080980",
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
    console.log({ Weave_Admin, Suzy_Adams, Hannah_Olive, Jimmy_Harper })
}
main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })