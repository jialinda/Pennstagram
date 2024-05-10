// const { embedding_functions } = require('chromadb/lib/utils'); // Adjust path based on actual structure
const { Chroma } = require('@langchain/community/vectorstores/chroma');

const { OpenAI, ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { CheerioWebBaseLoader } = require("langchain/document_loaders/web/cheerio");

const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { Document } = require("@langchain/core/documents");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { formatDocumentsAsString } = require("langchain/util/document");
const { OpenAIEmbeddingFunction } = require('chromadb');
// const { Chroma } = require("@langchain/community/vectorstores/chroma");

const {
    RunnableSequence,
    RunnablePassthrough,
} = require("@langchain/core/runnables");
// const { Chroma } = require("langchain/vectorstores/chroma");

const AWS = require('aws-sdk');
const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const helper = require('../routes/route_helper.js');
var path = require('path');
const { ChromaClient } = require("chromadb");
const fs = require('fs');

const mysql = require('mysql2');
const client = new ChromaClient();
const parse = require('csv-parse').parse;
const db = dbsingleton;
const api_key = process.env.OPENAI_API_KEY;

var vectorStore = null;

var getVectorStore = async function (req) {
    if (vectorStore == null) {
        vectorStore = await Chroma.fromExistingCollection(new OpenAIEmbeddings(), {
            collectionName: "llm_embeddings",
            url: "http://localhost:8000", // Optional, will default to this value
        });
        console.log('vector store:', vectorStore);
    }
    return vectorStore;
}




var getNaturalSearch = async function (req, res) {

    const collectionList = await client.listCollections();
    console.log("collection list: ");
    console.log(collectionList);
    await client.deleteCollection({ name: "llm_embeddings" });

    const emb_fn = new OpenAIEmbeddingFunction({
        openai_api_key: api_key,
        model: "text-embedding-3-small",
    });


    const collection = await client.createCollection({
        name: "llm_embeddings",
        embeddingsModel: emb_fn,
    });



    console.log('collection created:', collection);
    const users = await db.send_sql('SELECT * FROM users');
    const posts = await db.send_sql('SELECT * FROM posts');
     // Retrieve post contents
     const postsResult = await db.send_sql('SELECT post_id, content FROM posts');
     console.log('post result', postsResult);
    //  const postContent = postsResult[0]; // This now should contain all rows if db.send_sql returns [rows, fields]

    //  console.log('post content', postContent);

     // Retrieve user aliases
     const userAlias = await db.send_sql('SELECT user_id, username FROM users');

     const allDocs = [];
    const allIds = [];
    const metadatas = [];

    postsResult.forEach(post => {
        allDocs.push(post.content);
        allIds.push(`post-${post.post_id}`); // Adjusted to use post_id instead of id
        metadatas.push({ source: 'post' });
    });
    
    // Handle user aliases
    userAlias.forEach(user => {
        allDocs.push(user.username); // Adjusted to use username instead of alias
        allIds.push(`user-${user.user_id}`); // Adjusted to use user_id instead of id
        metadatas.push({ source: 'user' });
    });

    await collection.add({
        documents: allDocs,
        metadatas: metadatas,
        ids: allIds,
    });

    // const documents = users.map(user => ({
    //     id: `user-${user.user_id}`,
    //     content: `${user.username} ${user.firstname} ${user.lastname}`
    // })).concat(posts.map(post => ({
    //     id: `post-${post.post_id}`,
    //     content: `${post.title} ${post.content}`
    // })));


    await client.deleteCollection({ name: "test8" });
    await client.deleteCollection({ name: "test7" });
    await client.deleteCollection({ name: "user_post_collection" });

    // const results = await collection.search({
    //     query: "hi",
    //     maxResults: 10 // Limiting number of results for simplicity
    // });
    console.log("result query", await collection.peek());



    const vs = await getVectorStore();
    const retriever = vs.asRetriever();

    const question = req.body.question;
    // const prompt = PromptTemplate.fromTemplate(`
    // Context: {{context}}
    // Question: ${question}
    // Given the context above, can you give me a post or user for question?
    // `);
    console.log("question:", question);

    const context = await retriever.pipe(formatDocumentsAsString);
    const llm = new ChatOpenAI({ apiKey: process.env.OPENAI_API_KEY, modelName: 'gpt-3.5-turbo-16k-0613' });


    const prompt = PromptTemplate.fromTemplate(`
    Context: {{context}}
    Question: ${question}
    Given the context above, find a matching user or post for the question.
`);

const retrieverContext = await retriever.pipe(formatDocumentsAsString);
console.log("Retriever context:", retrieverContext);

const ragChain = RunnableSequence.from([
    {
        context: retrieverContext,  // Ensure context is correctly formatted and passed
        question: new RunnablePassthrough(),
    },
    prompt,
    llm,
    new StringOutputParser(),
]);

try {
    const result = await ragChain.invoke(question);
    console.log('Result:', result);
    res.status(200).json({ message: result });
} catch (error) {
    console.error('Error during retrieval:', error);
    res.status(500).json({ error: 'Failed to process your query.' });
}
}




var getMovie = async function(req, res) {
    const vs = await getVectorStore();
    const retriever = vs.asRetriever();

    const prompt =
    PromptTemplate.fromTemplate(`
    Given the reviews:
    {{context}}
    How will you recommend this movie?
    `);
    const llm = new ChatOpenAI({
        model: "gpt-3.5-turbo",
        openaiApiKey: process.env.OPENAI_API_KEY 
    }); // TODO: replace with your language model

    const ragChain = RunnableSequence.from([
        {
            context: retriever.pipe(formatDocumentsAsString),
            question: new RunnablePassthrough(),
          },
      prompt,
      llm,
      new StringOutputParser(),
    ]);

    console.log(req.body.question);

    result = await ragChain.invoke(req.body.question);
    console.log(result);
    res.status(200).json({message:result});
}


var llmroutes = {
    get_NaturalSearch: getNaturalSearch,
};

module.exports = llmroutes;
