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
  i. CMD + X, then make sure to click 'Y' to save changes
  j. Now run 'ssh -i ~/.ssh/nets2120-project.pem -4 -L 9092:ip-172-31-29-52.ec2.internal:9092 ubuntu@ec2-44-203-65-104.compute-1.amazonaws.com'

2. npm install - there's a small chance that some packages aren't listed on package-lock, so just manually install those with npm install {package}
3. !!!DANGER!!! (Do not change this without saving the previous value, otherwise we will lose our data queue checkpoint) 
    Go to config.json and change kafka.groupId to a random string
4. Run 'node ./models/kafka.js' 

Note: A route to post to Kafka will be added soon!

- move into project file
- copy paste entire file into app.js
- put kafka.js into db_access.js 
- they're eimplementing as express server but redo it 


// import that i might need 
<!-- const SnappyCodec = require('kafkajs-snappy')
CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec -->