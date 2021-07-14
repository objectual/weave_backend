<h1 align="center">
  <br>
  <a href="https://iweave.com"><img height=150 src="https://res.cloudinary.com/weavemasology/image/upload/v1626192849/logo/logo_wfkmdn.png" alt="iωeave"></a>
</h1>

<h4 align="center">iωeave Chat App Backend</h4>
      
<p align="center"> 
  <a href="#installation">Installation</a> •
  <a href="#updating">Updating</a> •
  <a href="#features">Features</a> • 
  <a href="#wiki">Wiki</a> •  
  <a href="#guides">Guides</a> •  
  <a href="#support">Support</a> • 
</p>

---

## Installation

##### Downloading and installing steps:
* Install nodejs dependencies 
```
npm i
```
* Install prisma client globally 
```
npm i -g @prima/client
```
* You need to migrate the current schema and run the default data seeder
```
prisma migrate dev
prisma db seed --preview-feature
```
* To view the current data
```
prisma studio
```
* For redis cache storage. This is important for the system
```
docker run --name redis -p 6379:6379 -d redis
```
* Postgresql db 
```
docker run --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password -d postgres
```
* PGAdmin for postgresql database
```
docker run --name pgadmin4 -p 10001:80 -e PGADMIN_DEFAULT_EMAIL=user@domain.com -e PGADMIN_DEFAULT_PASSWORD=SuperSecret -d dpage/pgadmin4
```
* For *Kafka* and *Zookeeper* you need to run these commands. Just add the **IP** where needed and run these commands

```
docker run -d -p 32181:32181 --name=zookeeper -e ZOOKEEPER_CLIENT_PORT=32181 -e ZOOKEEPER_TICK_TIME=2000 -e ZOOKEEPER_TICK_TIME=2000 confluentinc/cp-zookeeper
```

```
docker run -d -p 29092:29092 --name=kafka -e KAFKA_ZOOKEEPER_CONNECT=<IP>:32181 -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://<IP>:29092 -e KAFKA_BROKER_ID=2 -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 confluentinc/cp-kafka
``` 


## Updating

When a **new version** is out, you have **two methods** to _update_:

##### 1. You have already updated the schema:
* Check the new [commits](https://github.com/objectual/weave_backend/commits/master) and **update** the config **schema** by relying on the _commits_.

##### 2. You haven't updated the schema (or at least not so much):
* **Delete everything** (or **replace the files** when it asks).
* **Redo** `prisma migrate dev` step.

This _config_ is **updated** (at a random time), so make sure you **come back** here to **check** for **updates**.

## Features

|                            |      Completed     | ◾ Unit Tested    |
| -------------------------- | :----------------: | :-------------:  |
| Auth Service               |         ✔️         |        ✔️        |
| Connection Service         |         ✔️         |        ✔️        |
| Map User Find Service      |         ✔️         |        ✔️        |
| Events Service             |         ✔️         |        ✔️        |
| Map Location Update Sockets|         ✔️         |        ✔️        |
| Chat Sockets               |         ❌         |        ❌        |
| Notifications Service      |         ❌         |        ❌        |

## Wiki

Do you **need some help**? Check the project API doc from the [View Published Doc](https://documenter.getpostman.com/view/15958771/TzY69EUQ).

### End-to-End Encryption

As responsibility of a developer and privacy of users, all data transfer between users should be e2e encrypted using Public and Private key pairs.

<h1 align="center">
  <br>
  <a href="https://www.preveil.com/blog/public-and-private-key/"><img height=200 src="https://res.cloudinary.com/weavemasology/image/upload/v1626255087/end-to-end-encryption-1024x550_uggyvs.png" alt="iωeave"></a>
</h1>

Public key files are stored on the users encryption table while private keys are only sent once at login. 
Users could fetch the public key associated with the user they want to send messages to. 
Authenticated users can get their private keys at login only once and rotated at every login.
As a good practice, one should check timestamp on public key of user before sending a new message. 

## Guides

This explains how you as the developer can test the 

**Location Service**
- User location update
To test this, open `sockets/__mocks__` folder and run `node locationCheck.js --user_id= <USER ID> --jwt= <SESSION JWT>`
- User get other nearby users if they are in a certain range
To test this, open `sockets/__mocks__` folder and run `node nearbyUsers.js --user_id= <USER ID> --jwt= <SESSION JWT>`

**Chat**

These scenarios apply for all types of messages i.e (Text, Files, Voice Notes, Visual Media).
Non-Text based messages are first stored on a storage system such as *S3* *FireStore* *Cloudinary* and the public media link is sent as the message. The chat system will store that media for 30 days only.

There are 3 presence phases in this. Each for when a different user presence is set i.e *ONLINE*, *AWAY*, *OFFLINE*. And 2 main message states i.e *DELIVERED* (✓D), *READ* (✓R).

By default, every message that is sent to any `USER` or `GROUP` it is marked with the *SENT* (✓).

- **ONLINE** means the user is present in the app and when a message is received a **DELIVERED** action is performed. When the user is in a chat room, a **READ** action is performed on that message. If the **READ** action is ignored, the other user/s will not know the message is seen
- **AWAY** means the app is in background or killed, the recipient is fired a push notification to his FCM and a **DELIVERED** action is performed to notify other user/s about the message state 
- **OFFLINE** mean the network connection is down, messages are fired to the FCM and collected on a temporary 30 day storage. When network connection is restored, steps from **AWAY** are performed and message store is cleared. 


## Support

Reach out to me at one of the following places:

- Website at [AHMED BAIG](https://github.com/ahmedbaig) 
- E-Mail: **muahmedbaig@outlook.com**
