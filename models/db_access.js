const mysql = require('mysql');
const config = require('../config.json'); // Load configuration
const process = require('process');


/**
 * Implementation of a singleton pattern for database connections
 */

var the_db = null;

module.exports = {
    get_db_connection,
    set_db_connection,
    create_tables,
    insert_items,
    send_sql,
    close_db
}

/**
 * For mocking
 * 
 * @param {*} db 
 */
function set_db_connection(db) {
    the_db = db;
}

function close_db() {
    if (the_db) {
        the_db.end();
        the_db = null;
    }
}

/**
 * Get a connection to the MySQL database
 * 
 * @returns An SQL connection object or mock object
 */
async function get_db_connection() {
    if (the_db) {
        return the_db;
    }

    dbconfig = config.database;
    dbconfig.user = process.env.RDS_USER;
    dbconfig.password = process.env.RDS_PWD;
    the_db = mysql.createConnection(dbconfig);

        // Connect to MySQL
    return new Promise(function(resolve, reject) {
        the_db.connect(err => {
            if (err) 
                return reject(err);
            else {
                console.log('Connected to the MySQL server.');
                return the_db;
            }
        });
    });
}

/**
 * Sends an SQL query to the database
 * 
 * @param {*} query 
 * @param {*} params 
 * @returns promise
 */
async function send_sql(sql, params = []) {
    let connection;
    const dbconfig = {
        ...config.database,
        user: process.env.RDS_USER,
        password: process.env.RDS_PWD
    };

    try {
        connection = mysql.createConnection(dbconfig);
        console.log('Connected to the MySQL server.');

        return new Promise((resolve, reject) => {
            connection.query(sql, params, (error, results, fields) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    } catch (error) {
        console.error('Failed to execute query:', error);
        throw error;
    } finally {
        if (connection) {
            connection.end(err => {
                if (err) {
                    console.error('Failed to close the database connection:', err);
                } else {
                    console.log('Database connection closed successfully.');
                }
            });
        }
    }
}


  /**
 * Sends an SQL CREATE TABLES to the database
 * 
 * @param {*} query 
 * @param {*} params 
 * @returns promise
 */
async function create_tables(query, params = []) {
    return send_sql(query, params);
}


/**
 * Executes an SQL INSERT request
 * 
 * @param {*} query 
 * @param {*} params 
 * @returns The number of rows inserted
 */
async function insert_items(query, params = []) {
    result = await send_sql(query, params);

    return result.affectedRows;
}
