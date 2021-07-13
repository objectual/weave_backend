<h1 align="center">
  <br>
  <a href="https://iweave.com"><img src="https://res.cloudinary.com/weavemasology/image/upload/v1626192849/logo/logo_wfkmdn.png" alt="iωeave"></a>
</h1>

<h4 align="center">iωeave Chat App Backend</h4>
      
<p align="center"> 
  <a href="#installation">Installation</a> •
  <a href="#updating">Updating</a> •
  <a href="#features">Features</a> • 
  <a href="#wiki">Wiki</a> •  
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

|                            |      Completed   | ◾ Unit Tested |
| -------------------------- | :----------------: | :-------------: |
| Auth Service          |         ✔️         |        ✔️        |
| Connection Service             |         ✔️         |        ✔️        |
| Map User Find Service       |         ✔️         |        ✔️        |
| Events Service |         ✔️         |        ✔️        |
| Map Location Update Sockets   |         ✔️         |        ✔️        |
| Chat Sockets  |         ✔️         |        ❌        |
| Notifications Service       |         ❌         |        ❌        |

## Wiki

Do you **need some help**? Check the project API doc from the [View Published Doc](https://documenter.getpostman.com/view/15958771/TzY69EUQ).


## Support

Reach out to me at one of the following places:

- Website at [AHMED BAIG](https://github.com/ahmedbaig) 
- E-Mail: **muahmedbaig@outlook.com**
