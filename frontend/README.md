# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list


## Kafka Help
To run Kafka (load all posts from beginning):
1. First connect to the nets2120 kafka tunnel:
  a. Download the nets2120-project.pem file from Ed Discussion
  b. Drag and drop it into your nets2120 folder
  c. Open docker terminal
  d. From the docker terminal, move the nets2120-project.pem file to ~/.ssh (mv nets2120-project.pem ~/.ssh)
  e. Run chmod (chmod 600 ~/.ssh/nets2120-project.pem)
  f. From Docker terminal, run 'apt-get update' and 'apt-get install vim nano'
  g. From same terminal, run 'nano /etc/hosts'
  h. Go to the bottom of the file and add the line:
        ```
        127.0.0.1  ip-172-31-29-52
        ```
3.34.76.88 ip-172-31-29-52
ssh -i ~/.ssh/nets2120-project.pem -4 -L 9092:kafka.tunnel.universe.esinx.net:9092 ubuntu@ec2-44-203-65-104.compute-1.amazonaws.com

  i. CMD + X, then make sure to click 'Y' to save changes
  j. Now run 'ssh -i ~/.ssh/nets2120-project.pem -4 -L 9092:ip-172-31-29-52.ec2.internal:9092 ubuntu@ec2-44-203-65-104.compute-1.amazonaws.com'


2. npm install - there's a small chance that some packages aren't listed on package-lock, so just manually install those with npm install {package}
3. !!!DANGER!!! (Do not change this without saving the previous value, otherwise we will lose our data queue checkpoint) 
    Go to config.json and change kafka.groupId to a random string
4. Run 'node ./models/kafka.js' 
5. ^^^in our program, we'll run index.js (since it's not in any folder)

Note: A route to post to Kafka will be added soon!

- move into project file
- copy paste entire file into app.js
- put kafka.js into db_access.js 
- they're eimplementing as express server but redo it 

##
Here are some notes about what i should do to get kafka working and running:
// You just need to hook up a consumer to the Kafka topic.
// Federated Posts
// Your site should have a unique ID distinguishing it from all other NETS 2120 sites. This will be your team number (e.g. g01). Through the Kafka FederatedPosts channel, your site should both read and send posts that can be used by other projects' InstaLite sites. Posts should have a JSON component called post_json:

// {
//     username: '...',
//     source_site: '...',
//     post_uuid_within_site: '...',
//     post_text: '...',
//     content_type: '...'
// }
// as well as a binary component, attach, including an optional image. The content_type field in the JSON should be the HTTP content-type associated with the binary data.
  
// need to create helper function to parse the data
  // also need to deal w/ malformed texts, bad formatted posts that are sent through kafka
  // convert it to json first as well (because Kafka takes stuff in as strings)
  // check if post has hashtags, caption, etc...
  // first time we run it, want evreything from kafka to populate database
  // not in routes.js
  // put in index.js (root file of our express server); do a set timer thing for like 1 hour
  // producer function goes in routes file
  // consumer and produer (consumer is once every hour), producer (every single post we make on our app should be put in our kafka)

  // for post tables, whenever we upload a post from kafka, set post id to some neg number so whenever we seee post table, we know that it has come from kafka 


## original groupId: nets-2120-group-a