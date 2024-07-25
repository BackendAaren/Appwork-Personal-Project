# LionMQ
LionMQ is a distributed message queue system composed of the following components:

* **[*LionMQ*](https://github.com/BackendAaren/LionMQ)**: The core message queue system responsible for receiving, storing, and distributing messages. It supports features such as high availability, dynamic scaling, and load balancing.

* **[*LionMQ Client*](https://github.com/BackendAaren/LIONMQ_client)**: The client library that provides an API for interacting with the LionMQ system. Users can publish, subscribe, and process messages through this library.

* **[*LionMQWatcher*](https://github.com/BackendAaren/LionMQ_watcher)**: A monitoring tool for the LionMQ system, offering real-time health monitoring, status updates, and performance metrics visualization.

# Contents
- [How to use LionMQ](#How-to-use-LionMQ)

# Demo
  

# Features
 * **High Availability**: LionMQ Cluster ensures message high availability via mirrored queues, replicating messages across nodes to prevent data loss during node failures.
   
 * **Horizontal Scaling**: LionMQ Cluster’s capacity scales horizontally by adding nodes, enhancing overall throughput as each node handles client connections and message processing.
   
 * **Automatic Sharding**: LionMQ Cluster automatically shards queues across nodes, balancing load and optimizing performance through efficient resource utilization.
   
 * **Network Partition Tolerance**: LionMQ Cluster handles network partitions gracefully, resynchronizing data once the partition is resolved to ensure data integrity.
   
 * **Multi-Host Support**: LionMQ Cluster supports deployment across multiple hosts, improving reliability and scalability by enabling cooperative processing of messages.
   
 * **Dynamic Node Management**: [*LionMQ Client*](https://github.com/BackendAaren/LIONMQ_client) supports dynamic node management, allowing for non-disruptive scaling by adding or removing nodes as needed.
   
 * **Data Visualization and Real-Time Monitoring**:[*LionMQWatcher*](https://github.com/BackendAaren/LionMQ_watcher) provides comprehensive monitoring of each node's health status, tracks data processing progress within the message queues, and delivers detailed server metrics.
   
 * **Automatic Acknowledgment Mechanism**: LionMQ removes messages from the queue only upon receiving client-side acknowledgments. Backup nodes synchronize message processing statuses.
   
 * **Failover**: LionMQ provides seamless failover by automatically transferring queues from failed nodes to backup node, ensuring continuous availability.If a primary node fails, backup nodes retrieve pending messages from the database and reinsert them into the corresponding queue, ensuring seamless task continuity without message duplication.


# Architecture & Workflow
## Service
# How to start LionMQ service

## Step 1:
Download the YAML file and run the `docker compose up` command in the terminal.
[LionMQ docker-compose.yml](https://github.com/BackendAaren/Appwork-Personal-Project/blob/main/docker-compose.yml)
## Step 2:
Modify the environment variables in the YAML file.
#### PORT: Enter your server port
#### SERVER_HOST: Enter your server IP
#### WATCHER_SERVER: Enter your LionMQ Watcher Server IP
#### MONGODB_SERVER:
If you use Atlas to monitor your mongodb please enter your connection URL 
ex.(mongodb+srv://(your usernamer):(your password)@cluster0.mollxex.mongodb.net/?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=true)
#### MONGODB_DOCUMENT: Enter your the name that you want to show up on your mongodb document 
![example](image/docker_yml.png)
