[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-24ddc0f5d75046c5622901739e7c5dd533143b0c8e959d652212380cedb1ea36.svg)](https://classroom.github.com/a/qWBRrsAL)
# Homework 4

**Deadline: April 10, 2024, at 11:59 PM**  

## Overview 
In this homework, you will be building components of a basic social media application, preparing you for the final course project. You will be working with the same IMDb dataset as you have been using up until this point, but now you will be focusing on adding `users` and `posts` to the application.

## Setup

### Clone the Code

Once you accept the GitHub Classroom assignment, you will have a private repository with the
name `homework-4-ms1-{myid}`. This repository contains the starter code for the assignment. **Change `{myid}` to your
PennKey.**

Here is how you will check out the `homework-4-ms1` to your machine:

1. Navigate to the GitHub repository of _your_ homework4-ms1-{myid} assignment.
2. Click the green Code button and copy the SSH link.
3. Open up your local terminal/command-line interface and `cd` to `~/nets2120`. (On
   Windows: `cd %userprofile%\nets2120`).
4. Clone the repository by running `git clone <ssh link> homework-4-ms1-{myid}`. This should create a new
   folder `homework-4-ms1-{myid}` with the contents of the repository inside of your `nets2120` directory.

### Launch Docker

1. Launch the Docker Desktop app.
2. Open up a terminal window
3. Enter: `docker start nets2120`
4. Enter: `docker exec -it nets2120 bash`. This should enter you into the docker shell.

### Connecting to AWS:

1. [Launch Your AWS Learner Lab](https://awsacademy.instructure.com/courses/66654/modules/items/5910588) by clicking on "Start Lab". Wait for a minute for the lab to start.
2. When the status turns green on the top left, click on "AWS Details," then "Show" next to "AWS CLI." Copy the AWS CLI
   configuration text.
3. In Docker, run:
    * `mkdir ~/.aws` (only if the directory does not already exist)
    * `touch ~/.aws/credentials`
    * `echo "[copied config]" > ~/.aws/credentials`

**Note**: Each session lasts for 4 hours max, and credentials must be re-entered each session in Learner's Lab.

### RDS Setup:

You should still have your RDS that you created in Homework 2, called `imdbdatabase`, except you had temporarily stopped it in HW2. Restart the RDS now. It will get a different domain name but otherwise should be OK.

(If you deleted your RDS instance, no problem, just go back to the Homework 2 Milestone 2 instructions for how to create the database and run the loader.)

In either case: You will need to repeat the setup from Homework 2 to allow for a "tunnel" to the server from your Docker container. For your convenience, we repeat the steps for that process below.

### EC2 Nano Instance Setup [Every Time You Launch the Learner Lab]

In the *AWS Console*, go to **EC2**, Instances, and click on **Launch Instances**.

1. Name the instance `Tunnel`.
1. Pick *Ubuntu* from the Application and OS Images Quick Start.
1. Scroll down to **Instance Type** and pick **t2.nano**.
1. **Different from HW2:** Select the existing key pair from Homework 2 called `tunnel`.

#### Link RDS and EC2 Nano Instance

From your browser, go into the AWS Console's EC2 Dashboard. Click on the details of your `tunnel` server. Go to the **Actions** menu and select **Networking**.  Click on **Connect RDS Database**. Choose **Instance**, then select your RDS database from the list.

#### Setting up the Tunnel

You'll need to collect two hostnames:
1. The name of your RDS server, e.g., database-2.czkkqa8wuy3r.us-east-1.rds.amazonaws.com
2. The name of your EC2 nano tunnel server, e.g., ec2-3-86-71-131.compute-1.amazonaws.com

Edit this command, setting the `dbserver` and `tunnelserver` (it should be a single line):

```
ssh -i ~/.ssh/tunnel.pem -4 -L 3306:dbserver:3306 ubuntu@tunnelserver
```

As an example, here is a version that worked for us:

```
ssh -i ~/.ssh/tunnel.pem -4 -L 3306:database-2.czkkqa8wuy3r.us-east-1.rds.amazonaws.com:3306 ubuntu@ec2-3-86-71-131.compute-1.amazonaws.com
```

ssh -i ~/.ssh/tunnelgrace2.pem -4 -L 3306:instadb.cbbt2woocf66.us-east-1.rds.amazonaws.com:3306 ubuntu@ec2-3-88-170-21.compute-1.amazonaws.com

**First-Time You Connect to the New Tunnel**. The first time you create the tunnel server, may need to answer `yes` to whether you trust the server.  You'll be logged into an Amazon EC2 node at this point.

**Only do this if you re-created your RDS instance, rather than restarting it**.
Run `sudo apt update` and then `sudo apt install mysql-client-core-8.0` so you have the MySQL client on EC2.  Next you'll need to log into the RDS server.  Do this by running (replacing the host with your version of the RDS database domain above, e.g., `imdbdatabase...amazonaws.com``):

```
mysql --host=instadb.XXXXXX.us-east-1.rds.amazonaws.com --user=admin --password=netsfinalproject
```

Until `ssh` exits, you'll have a "tunnel" set up so requests in your container for `localhost` port `3306` get redirected to the tunnel server; then it makes requests to the database server on your behalf.

Leave this terminal open until you are done. Meanwhile you'll want to create a new terminal connection (e.g., via `docker exec -it nets2120 bash`) to do your remaining work.

## Part 1: 
For the first part, you should implement user accounts, friends functionality, and basic posts. 

### Learning Objectives: 
1. Implement a variety of RESTful API routes related to common social media application operations. 
2. Work with React components to interact with your routes and create a functional frontend. 

### <ins>Part 1: Setting up new tables</ins>
You should create two MySQL tables (populate the SQL commands in [create_tables.js](models/create_tables.js) to do this). An example query for creating the `friends` table is included for your reference. The schema for these tables should be the following: 

- Table name: users
  - user_id
    - int 
    - can't be NULL 
    - auto-incremented primary key 
  - username
    - varchar of size 255
  - hashed_password
    - varchar of size 255
  - linked_nconst
    - varchar of size 10
    - foregin key to the `nconst_short` field in `names`
- Table name: posts
  - post_id
    - int 
    - can't be NULL 
    - auto-incremented primary key 
  - parent_post
    - int
    - foreign key reference to `post_id` in `posts` (this will be the ID of a post's parent post once we start implementing threads)
  - title
    - varchar of size 255
  - content
    - varchar of size 255
  - author_id
    - int
    - foreign key to `user_id` in `users`

Then, run `npm run create_tables` in your terminal to run this file. 

#### If You Don't Have a Complete Database from HW2/3

There are optional, commented-out commands in `create-tables.js` that can be used to re-create the original RDS tables for IMDB (except for names, which you'll have to define).  You can also get CSV data that you can load into the tables from [here](https://penn-cis545-files.s3.amazonaws.com/sample-data.zip) (you'll need to read + load in the rows).

### <ins>Part 2: RESTful API</ins>
In `routes.js`, you will be creating the backend service using Node.js.

#### Configuration Setup
To connect your backend service to an AWS RDS instance, you will need to (1) create a `.env` file with credentials, and (2) modify [config.json](config.json) to use the connection information for your RDS database.

`.env` should have items from your AWS Academy Details first, then your RDS user ID (possibly `admin` but it depends on your settings) and password, then an OpenAPI key (we will provide one):
```
export AWS_ACCESS_KEY_ID=
export AWS_SECRET_ACCESS_KEY=
export AUTH_TOKEN=
export RDS_USER=
export RDS_PWD=
export OPENAI_API_KEY=
export USE_PERSISTENCE=TRUE
```

**Important: each time you open a new Terminal in your Docker container, you should `source .env` from the `homework4-milestone1-{pennkey}` directory.  ChromaDB, npm, and other tools will rely on this.**

`config.json` should have:
1. **Host**: The `host` value is the endpoint of your RDS instance. This endpoint is provided in the
   RDS dashboard and typically looks
   like `your-db-instance.cg034hpkmmjt.us-east-1.rds.amazonaws.com`. **However, for this
   assignment**, because we use a tunnel to forward requests, **you should set the host to
   `localhost`**.
2. **Port**: Ensure the `port` value matches the port used by your RDS instance. The default MySQL
   port is `3306`, but check your RDS instance settings to confirm.
3. **Database**: Ensure the `database` field matches the name of the database within your RDS
   instance you wish to connect to.

After updating `config.json`, your configuration should look something like this (note: these are
example values, replace them with your actual RDS details):

```json
{
  "database": {
    "host": "localhost",
    "port": "3306",
    "database": "yourRdsDatabaseName"
  },
  "serverPort": "8080"
}
```

You will rely on an SSH tunnel to connect to the RDS instance.

#### ChromaDB

For the LLM portion of the assignment, you will want to use *ChromaDB* as your vector store, and have it look up IMDB movie reviews.

* We've pre-indexed the data and you can download from [here](https://penn-cis545-files.s3.amazonaws.com/chromadb.zip)
* Copy it from your host machine into your shared `nets2120` directory
* From a terminal *within Docker* (open using VSCode or `docker -it nets2120 bash`):
  * Move into the `data` directory under your `homework4-ms1-{pennkey}` directory.
  * From there, unzip so you see `data`, then `chromadb` as a subdirectory.
  * Now, in the `homework4-ms1-{pennkey}` directory, run `chroma run --host 0.0.0.0 --port 8000 --path ./data/chromadb`.

#### API Specifications
The main program, [app.js](app.js), registers route handlers. You'll need to look at [register_routes.js](routes/register_routes.js) and [routes.js](routes/routes.js) to fill in the stubbed code for the following routes. (`Register_routes` is mostly complete except for one route registration, but `routes` generally has blank function bodies). In `routes.js`, use `db.send_sql()` (found in [db_access.js](models/db_access.js)) to send queries to your database, in the same way that `queryDatabase()` worked in Homework 2 MS2.  

**BEWARE SQL INJECTION ATTACKS for any parameters taken from the client. For simplicity we won't be using prepared statements, so you should filter the allowed characters / strings.  Note we have provided a function to help with that, which disallows quotes and other characters that might result in SQL injection. **

You should find a couple of useful functions in [route_helper.js](routes/route_helper.js), to do pattern matching
of strings and to compare values with session information.

- `/register` accepts POST requests with the following **body** parameters: 
  - `username`
  - `password`
  - `linked_id`
  
  To register a user, add the given information about the user into the `users` table. 
  
  Make sure that you *salt and hash* the raw password text (see our lecture on computer security) passed in through the body parameters and are only storing the `hash` in the database. We will be doing this using `bcrypt`, which you can find more information about [here](https://www.npmjs.com/package/bcrypt).

  For convenience we have modularized out your encryption function into [route_helper.js](routes/route_helper.js) -- you should fill in the body of `encryptPassword(raw_pass, callback)`.  You can call it as `helper.encryptPassword(...)` in `postRegister` to get your desired hash before inserting the user info into the table. 

  When the registration is successful, return a status `200` with the following example response structure: `{username: 'rpeng'}`.

  - **Error handling:**
    - Return status `400` with JSON `{error: 'One or more of the fields you entered was empty, please try again.'}` for invalid query parameters. These include when: 
      - `username` is not provided.
      - `password` is not provided.
      - `linked_id` is not provided. 
    - Return status `409` (Conflict) with JSON `{error: "An account with this username already exists, please try again."}` when the username already exists in the database. 
    - Return status `500` with JSON `{error: 'Error querying database.'}` for any database query errors. 

- `/login` accepts POST requests with the following **body** parameters:
  - `username`
  - `password`
 
  Use `bcrypt` to compare the password given in the login attempt with the hash stored in the `users` table for the user with the given `username`. When the login attempt is successful, return a status `200` with the following example response structure: `{username: 'rpeng'}`.

  - **Error handling:**
    - Return status `400` with JSON `{error: 'One or more of the fields you entered was empty, please try again.}` for invalid query parameters. These include when: 
      - `username` is not provided.
      - `password` is not provided.
    - Return status `500` with JSON `{error: 'Error querying database'}` for any database query errors. 
    - Return status `401` (Unauthorized) with JSON `{error: Username and/or password are invalid.'}`. 

  - **Session management:**
    - If the login attempt is successful, we would like to store the current logged in user's information in the browser's session object. 
    - When a user is logged in, store the `user_id` of that user in the session object using `req.session.user_id`. 


- `/logout` accepts GET requests and removes the current user from the `req.session` object (set `req.session.user` to `null`). 
  - After successfully logging the user out, return a status 200 with `{message: "You were successfully logged out."}` in the response. 

The following functions should all test whether the `req.session` information indicates the user is logged in -- if not they should return an error (see codes below).


- `/:username/friends` accepts GET requests and returns an array of UNIQUE friends that the current user followss in the session. This should only be allowed if a user is logged in. 

  You should select the `nconst` and `primaryName` of every person who is *followed* by the current session user (who should be the *follower*). (Hint: you may want to use multiple JOINs to link the `users`, `friends`, and `names` tables together).

  When getting friends is successful, return a status `200` with a result that looks like this: 

  ```
  const response = {
    results: [
      {
        followed: "nm0784407",
        primaryName: "Mack Sennett"
      }, 
      {
        followed: "nm1802226",
        primaryName: "Joseph Maddern"
      }
    ]
  }
  ```

  - **Error handling:**
    - Return status `403` (Forbidden) with JSON `{error: 'Not logged in.'}` if there is no user logged in. 
    - Return status `500` with JSON `{error: 'Error querying database'}` for any database query errors. 


- `/:username/recommendations` accepts GET requests and returns an array of friend recommendations for the current user in the session. 

  You should select the `recommendation` and `primaryName` of every person who is *recommended* by the current session user (who should be the *person*). 

    When getting friends is successful, return a status `200` with a result that looks like this: 

    ```
    const response = {
      results: [
        {
          recommendation: "nm0784407",
          primaryName: "Mack Sennett"
        }, 
        {
          recommendation: "nm1802226",
          primaryName: "Joseph Maddern"
        }
      ]
    }
    ```

  - **Error handling:**
    - Return status `403` (Forbidden) with JSON `{error: 'Not logged in.'}` if there is no user logged in. 
    - Return status `500` with JSON `{error: 'Error querying database'}` for any database query errors. 


- `/:username/createPost` accepts POST requests with the following **body** parameters: 
  - `title`
  - `content`
  - `parent_id`

  Only allow this route if a user is logged in. The ID of the current session user should be the `author_id`.   Screen the title and content to only be alphanumeric characters, spaces, periods, question marks, commas, and underscores (e.g., no quotes, semicolons, etc.) to protect against SQL injection.

  Upon successful post creation, return a **status 201** with the response `{message: "Post created."}`.

  - **Error handling:**
    - Return status `403` (Forbidden) with JSON `{error: 'Not logged in.'}` if there is no user logged in. 
    - Return status `400` with JSON `{error: 'One or more of the fields you entered was empty, please try again.'}` if any of the provided body params are empty. 
    - Return status `500` with JSON `{error: 'Error querying database.'}` for any database query errors. 

- `/:username/feed` accepts GET requests
  - Write a query that returns an array of posts that should be in the current session user's feed. For each post, `SELECT` the post id, author's username, parent post id, title, and content 
  - When getting the feed is successful, return a status `200` with a result that looks like this: 
  ``` 
  const response = {
    results: [
      {
        username: 
        parent_post: 
        title: 
        content:
      },
      {
        username: 
        parent_post: 
        title: 
        content:
      }
    ] 
  }
  ```
  - **Error handling:**
    - Return status `403` (Forbidden) with JSON `{error: 'Not logged in.'}` if there is no user logged in. 
    - Return status `500` with JSON `{error: 'Error querying database.'}` for any database query errors. 

- `/:username/movies` accepts POST requests
   - Register `getMovie` in `register_routes.js`
   - Define a PromptTemplate for the LLM that tells it to answer the question given a context and a question.
   - Create a ChatOpenAI() agent for the `llm` variable. Pick gpt-3.5-turbo or one of its variations.
   - Check out the [Langchain docs](https://js.langchain.com/docs/get_started/introduction) if you have any questions about the code given to you. 

#### Running the Server: 
To run the server, you will need to install the required packages using `npm install` and then run the server using `npm start` from inside the `milestone1` directory and from the Docker terminal. The server will be running on `http://localhost:8080`.

### <ins>Part 3: Frontend Design</ins>
Starter code is provided for you for the pages and components that we would like to see in the frontend. Please go through the following tasks and complete the TODOs mentioned in the code. 

#### Task 1: Sign Up Page
For this task, you will be working in `Signup.tsx`. 
- Use `useState` to store the four user inputs on this page: `username`, `password`, `confirmPassword`, `linked_nconst`
- Then, complete the `handleSubmit` function, which should make a backend call to the `/register` route to register a user with the information that is inputted to the form.
- If the registration is successful, use `navigate()` to redirect the user to the `/home` page. 
- If registration is unsuccessful, use `alert()` to send an alert to the user with the message "Registration failed." 

#### Task 2: Login Page
Navigate to `Login.tsx`.
- Complete the `handleLogin` function, which should make a backend call to the `/login` route to check user credentials. 
- If the login attempt is successful, use `navigate()` to redirect the user to the `/home` page. 
- If login attempt is unsuccessful, use `alert()` to send an alert to the user with the message "Log in failed." 

#### Task 3: Friends Page 
Navigate to `Friends.tsx`. Here, you will find three TODOs. 
- Use `useEffect()` to make backend calls to `/:username/friends` and `/:username/recommendations` to get the user's friends and recommendations. 
- Use `.map()` in  to map each friend to a `FriendComponent` and fill in the necessary information about each friend in the component. 
- Use `.map()` again to map each recommendation to a `FriendComponent` as well with the correct information. 

#### Task 4: Home Page
Navigate to `Home.tsx`. This page is very similar to the Friends page, except now we have posts. Again, there are two TODOs on this page. 
- Use `useEffect()` to make a backend call to `/feed` to get all the posts that should be in the current user's feed. 
- Use `.map()` to map each post to a `PostComponent` (which you can find in `./components/PostComponent.tsx`), and fill in the necessary details for each post in the component.

#### Task 5: Chat Interface
Navigate to `ChatInterface.tsx`.
- Complete the `sendMessage()` function to call the backend's `:username/movies` endpoint, process the response, and call `setMessages` with that response.

#### Running the frontend
To run the frontend, you will need to install the required packages using `npm install` and then run the app using `npm run dev --host` from inside the `frontend` directory and from the Docker terminal. The frontend will be running on `http://localhost:4567`.
