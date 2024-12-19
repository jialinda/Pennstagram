This proejct involves building "InstaLite," an Instagram-like social media site with full support for images. 

This contains a number of elements:
* **Backend** services in Node.js and/or Java, hosted on Amazon EC2 (you may use `nginx` to make these accessible through the same TCP port)
* **Database** (accounts, social network, etc.) hosted in RDS and/or DynamoDB (many aspects will work better in RDS)
* **Image search** based on embeddings similarity, in ChromaDB
* Large objects stored in S3, as necessary
* **Natural language search** using GPT or an alternative LLM
* Social **news streaming** via Apache Kafka
* Adsorption ranking of posts and individuals via Apache Spark
* Proper handling of security and sessions
* **Frontend** in React and Javascript
