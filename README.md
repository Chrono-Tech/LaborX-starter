# Setup instructions

## 1. Checkout starter project

```
git clone git@bitbucket.org:laborx-profile/laborx.profile.starter.git
```

## 2. Build & install docker images

Go to the  project root:

```
cd ./laborx.profile.starter
```

### 2.1. Build the backend container

Execute this command from the project root:

```
docker build \
  --tag laborx-profile-backend \
  --file ./setup/backend/Dockerfile \
  --build-arg GIT_BRANCH=develop \
  .
```

GIT_BRANCH used to specify source branch of the main project and all the subprojects.
Add --no-cache option if you have caching issues.

### 2.2. Build the RabbitMQ container

Execute this command from the project root:

```
docker build \
  --tag laborx-profile-rabbitmq \
  --file ./setup/rabbit/Dockerfile \
  .
```

Add --no-cache option if you have caching issues.

## 3. Create network

```
docker network create --driver=bridge --subnet=192.168.13.0/24 laborx-profile
```

We will use these hosts and ip addresses:

| Host                         | Ip                  | Port(s)                  | Purpose                                |
|------------------------------|---------------------|--------------------------|----------------------------------------|
| host                         | 192.168.13.1        |                          | Host machine, proxy and gateway        |
| laborx.profile.mongo         | 192.168.13.2        | 27017                    | Mongo database                         |
| laborx.profile.rabbit        | 192.168.13.3        | 15670 15671 15672 15674  | rabbitmq                               |
| laborx.profile.backend       | 192.168.13.4        | 3000                     | Backend application (REST & Admin app) |

## 4. Run docker images

### 4.1. Run the storage container

1. Before first launch create storage folder on your host machine:
```
mkdir -p /var/data/laborx.profile.mongo/db
```

2. Run the container using this command:
```
docker run \
  --name laborx.profile.mongo \
  --network laborx-profile --ip 192.168.13.2 \
  --restart=always --detach \
  --mount type=bind,src=/var/data/laborx.profile.mongo/db,dst=/data/db \
  mongo mongod --auth
```

Container exports port 27017, so you can also add `--publish 27017:27017` param to `docker run` if necessary.

3. After the first launch bootsrtap a mongo database:

  - Connect to mongo in the container locally
  ```
  docker exec -it laborx.profile.mongo mongo admin
  ```

  - Create an admin account in the mongo shell inside a container
  ```
  db.createUser({ user: 'admin', pwd: 'admin', roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]});
  ```

  - Exit from the mongo shell and the container
  ```
  exit
  ```

  - Connect to mongo in the container using mongo client
  ```
  mongo mongodb://192.168.13.2:27017/admin --username admin --password
  ```
  (this command will propt for a password, type "admin")

  - Create a database and a user for the backend application
  ```
  use laborx-profile-backend
  db.createUser({ user: 'profile', pwd: 'profile', roles: [ { role: "dbOwner", db: "laborx-profile-backend" } ]});
  ```

  - Exit from the mongo shell
  ```
  exit
  ```

  - Try the connection
  ```
  mongo mongodb://192.168.13.2:27017/laborx-profile-backend --username profile --password
  ```
  (this command will propt for a password, type "profile")

  - Exit from the mongo shell
  ```
  exit
  ```

### 4.2. Run the RabbitMQ container

1. Before first launch create storage folder on your host machine:
```
mkdir -p /var/data/laborx.profile.rabbitmq
```

2. Run the container using this command:
```
docker run \
  --name laborx.profile.rabbitmq \
  --hostname laborx-profile-rabbitmq \
  --restart=always --detach \
  --network laborx-profile --ip 192.168.13.9 \
  --mount type=bind,src=/var/data/laborx.profile.rabbitmq,dst=/var/lib/rabbitmq \
  laborx-profile-rabbitmq
```

Container exports port 15672 (management), 15670 (examples), 15674 (stomp over ws), 15671 (amqp), so you can also add `--publish host-port:container-port` param to `docker run` if necessary.

### 4.3. Run the backend container

1. Before first launch create files folder on your host machine:
```
mkdir -p /var/data/laborx.profile.files
```

2. Run the container using this command:
```
docker run \
  --name laborx.profile.backend \
  --restart=always --detach \
  --network laborx-profile --ip 192.168.13.3 \
  --mount type=bind,src=$(pwd)/setup/backend/config,dst=/data/config \
  --mount type=bind,src=/var/data/laborx.profile.files,dst=/data/files \
  laborx-profile-backend
```

Container exports port 3000, so you can also add `--publish 3000:3000` param to `docker run` if necessary.
You can also specify custom environment (and custom config):

```
docker run \
  --name laborx.profile.backend \
  --restart=always --detach \
  --network laborx-profile --ip 192.168.13.3 \
  --mount type=bind,src=$(pwd)/setup/backend/config,dst=/data/config \
  --mount type=bind,src=/var/data/laborx.profile.files,dst=/data/files \
  laborx-profile-backend pm2-runtime start ecosystem.config.js --env development
```

By default `docker run` command will start pm2 inside a container with these arguments:
```
pm2-docker start ecosystem.config.js --env production
```

### 5. Helpful commands

| Command                                           | Description                                     |
|---------------------------------------------------|-------------------------------------------------|
| `docker exec -it <container-id> pm2 monit`        | Monitoring CPU/Usage of each process            |
| `docker exec -it <container-id> pm2 list`         | Listing managed processes                       |
| `docker exec -it <container-id> pm2 reload all`   | 0sec downtime reload all applications           |
| `docker exec -it <container-id> pm2 show`         | Get more information about a process            |
| `docker stop <container-id>`                      | Stop the container                              |
| `docker rm <container-id>`                        | Remove the container                            |
| `docker system prune -a`                          | Remove unused containers, images and networks   |
| `docker network remove <network-id>`              | Remove network                                  |
| `docker ps`                                       | List and containers                             |
| `docker container inspect <container-id>`         | Show container details                          |
