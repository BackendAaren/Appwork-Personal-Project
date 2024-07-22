# How to use LionMQ

## Step 1:
Download the YAML file and run the `docker compose up` command in the terminal.
[LionMQ docker-compose.yml](https://github.com/BackendAaren/Appwork-Personal-Project/blob/main/docker-compose.yml)
## Step 2:
Modify the environment variables in the YAML file.
#### PORT:
Enter your server port
#### SERVER_HOST:Enter your server IP
#### WATCHER_SERVER:
Enter your LionMQ Watcher Server IP
#### MONGODB_SERVER:
If you use Atlas to monitor your mongodb please enter your connection URL 
ex.(mongodb+srv://(your usernamer):(your password)@cluster0.mollxex.mongodb.net/?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=true)
#### MONGODB_DOCUMENT:
Enter your the name that you want to show up on your mongodb document 
![example](image/docker_yml.png)
