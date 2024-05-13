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
// const { PortkeySession } = require('langchain/llms/portkey');
const client = new ChromaClient();
const parse = require('csv-parse').parse;
const db = dbsingleton;
const api_key = process.env.OPENAI_API_KEY;

var vectorStore = null;

var getVectorStore = async function (req) {
    if (!vectorStore) {
        vectorStore = await Chroma.fromExistingCollection({
            apiKey: process.env.OPENAI_API_KEY,
            batchSize: 512,
            model: "text-embedding-3-large",
        }, {
            collectionName: "llm_embeddings_1",
            url: "http://localhost:8000", // This is the default value, can be omitted if not changed
            collectionMetadata: {
                "hnsw:space": "cosine",
            }
        });
        console.log("VECTOR STORE INITIALIZED: ", vectorStore);
    }
    return vectorStore;
}




var getNaturalSearch = async function (req, res) {

    const collectionList = await client.listCollections();
    console.log("collection list: ");
    console.log(collectionList);
    await client.deleteCollection({ name: "llm_embeddings_1" });

    const emb_fn = new OpenAIEmbeddingFunction({
        openai_api_key: api_key,
        model: "text-embedding-3-small",
    });


    const collection = await client.createCollection({
        name: "llm_embeddings_1",
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
    //  const userAlias = await db.send_sql('SELECT user_id, username FROM users');

     const allDocs = [];
    const allIds = [];
    const metadatas = [];
    var contentHolder = [];

    postsResult.map(post => {
        const embedding = post.post_id + "|" + post.content;
        contentHolder.push(new Document({pageContent: embedding, metadata: {source: post.post_id}}));
        allIds.push(post.post_id);
    })

    vectorStore = await Chroma.fromDocuments(contentHolder, new OpenAIEmbeddings({
        apiKey: process.env.OPENAI_API_KEY,
        batchSize: 512,
        model: "text-embedding-3-large",
    }), allIds, {
        collectionName: "llm_embeddings_1",
        url: "http://localhost:8000", // This is the default value, can be omitted if not changed
        collectionMetadata: {
            "hnsw:space": "cosine",
        }
    });


    console.log("result query", await collection.peek());



    const question = req.body.question;
    // const prompt = PromptTemplate.fromTemplate(`
    // Context: {{context}}
    // Question: ${question}
    // Given the context above, can you give me a post or user for question?
    // `);
    console.log("question:", question);



    const vs = await getVectorStore();
    const retriever = vs.asRetriever();
    const similars = await vs.similaritySearch(question, 10);
    console.log('similars:', similars);
    const context = similars.map((p) => p.pageContent).join("\n");
    console.log('context:', context);

    

    // const context = await retriever.pipe(formatDocumentsAsString);
    const llm = new ChatOpenAI({ apiKey: process.env.OPENAI_API_KEY, modelName: 'gpt-3.5-turbo-16k-0613' });


    const prompt = PromptTemplate.fromTemplate(`Based on the context ${context} you have, find me posts similar to  ${question}
    `);

// const retrieverContext = await retriever.pipe(formatDocumentsAsString);
// console.log("Retriever context:", retrieverContext);

    const ragChain = RunnableSequence.from([
        {
            context: new RunnablePassthrough(),  // Ensure context is correctly formatted and passed
            question: new RunnablePassthrough(),
        },
        prompt,
        llm,
        new StringOutputParser(),
    ]);

    try {
        console.log('inputted context:', context);
        const result = await ragChain.invoke(context, question);
        console.log('Result:', result);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error('Error during retrieval:', error);
        res.status(500).json({ error: 'Failed to process your query.' });
    }
}



var llmroutes = {
    get_NaturalSearch: getNaturalSearch,
};

module.exports = llmroutes;