// const { embedding_functions } = require('chromadb/lib/utils'); // Adjust path based on actual structure
// const { Chroma } = require('@langchain/community/vectorstores/chroma');

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
const {OpenAIEmbeddingFunction} = require('chromadb');
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
const emb_fn = new OpenAIEmbeddingFunction({
            openai_api_key: api_key, 
            model: "text-embedding-3-small"
        });

var vectorStore = null;

var getVectorStore = async function(req) {
    if (vectorStore == null) {
        vectorStore = await Chroma.fromExistingCollection(new OpenAIEmbeddings(), {
            collectionName: "imdb_reviews",
            url: "http://localhost:8000", // Optional, will default to this value
            });
    }
    return vectorStore;
}

async function createCollectionIfNotExists(collectionName) {
    console.log("start creating...");
    try {
        // const collections = await client.listCollections();
        const collections = await client.listCollections();
        console.log("collection list: ");
        console.log(collections);


        const collection =  await client.createCollection({
                name: collectionName,
                embeddingsModel: emb_fn
        });
        console.log('collection created:', collection);
        return collection
    } catch (error) {
        console.error('Error accessing or creating collection:', error);
        throw error;
    }
}


async function getEmbeddings(texts) {
    const embeddings = new OpenAIEmbeddings({
        apiKey: process.env.OPENAI_API_KEY,
        batchSize: 512,
        model: "text-embedding-3-small"
      });
    
    try {
        const vectors = await embeddings.embedDocuments(texts)
        return vectors;
    } catch (error) {
        console.error('Failed to get embeddings:', error);
        throw error;
    }
}


async function indexDocuments() {
    // const users = await db.send_sql('SELECT * FROM users');
    // const posts = await db.send_sql('SELECT * FROM posts');

    // // Create documents formatted for embedding generation
    // const userDocuments = users.map(user => ({
    //     id: `user-${user.user_id}`,
    //     content: `${user.username} ${user.firstname} ${user.lastname}`
    // }));
    // const postDocuments = posts.map(post => ({
    //     id: `post-${post.post_id}`,
    //     content: `${post.title} ${post.content}`
    // }));

    // const vectorStore = createCollectionIfNotExists("test6");

    const vectorStore = await client.createCollection ({
        name: "test8",
        embeddingFunction: emb_fn,
    })

    // Add documents to ChromaDB
    console.log("newly created collection:", vectorStore);

    const testDocuments = ["I love playing basketball.", "I love playing football.", "I love playing tennis.", "Alice", "Bob", "Charlie"];
    const metadatas = [
        { 'source': "post" },
        { 'source': "post" },
        { 'source': "post" },
        { 'source': "user" },
        { 'source': "user" },
        { 'source': "user" }
    ];
    const ids = ["p1", "p2", "p3", "u1", "u2", "u3"];

    const embeddings = await getEmbeddings(testDocuments);
    await vectorStore.add({
        documents: embeddings,
        metadatas: metadatas,
        // embeddings: embeddings,  // Only include this line if embeddings are required
        ids: ids
    });


    console.log("vector store collection:", vectorStore);

  
        // await vectorStore.add(userDocuments.concat(postDocuments));
    console.log("Documents indexed in ChromaDB");
}


var getNaturalSearch = async function (req, res) {
    // const collection = createCollectionIfNotExists("test6");
    await client.deleteCollection({name: "test8"});
    
    await indexDocuments();
    // const vs = await getVectorStore();
    // const retriever = vs.asRetriever();

    const collections = await client.listCollections();
    console.log("collection list: ");
    console.log(collections);

    // console.log('vs:', vs);
    // const retriever = vs.asRetriever();
    // const results = await vs.search({ query: req.body.question });


    const prompt =
        PromptTemplate.fromTemplate({
            context: 'Find the related user and post based on the {question}',
            contextParams: {question: req.body.question }
        });
    //const llm = null; // TODO: replace with your language model
    const llm = new ChatOpenAI({ apiKey: process.env.OPENAI_API_KEY, modelName: 'gpt-3.5-turbo', temperature: 0 });

    const ragChain = RunnableSequence.from([
        {
            context: retriever.pipe(formatDocumentsAsString),
            // context: results,
            question: new RunnablePassthrough(),
        },
        prompt,
        llm,
        new StringOutputParser(),
    ]);

    console.log(req.body.question);

    result = await ragChain.invoke(req.body.question);
    console.log(result);
    res.status(200).json({ message: result });
}


var llmroutes = {
    get_NaturalSearch: getNaturalSearch,   
  };
    
module.exports = llmroutes;
