const bcrypt = require('bcrypt'); 
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require('fs');

var uploadToS3 = async function(username, file) {
    // Initialize S3 client
    const client = new S3Client({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
    });
    console.log(file.mimetype)
    console.log(file.path)

    // Read file and upload to S3
    fs.readFile(file.path, async (err, data) => {
        if (err) {
            console.log("error in reading" + err)
            return;
        }
        // S3 Upload parameters
        const command = new PutObjectCommand({
            Bucket: "instas3-group5",
            Key: username + "/pic",
            Body: data,
            ContentType: file.mimetype
        });

        // Upload to S3
        try {
            const response = await client.send(command);
            console.log("Successfully uploaded file to s3. " + response);
        } catch (e) {
            console.log("An error occured while trying to upload to S3. " + e);
            return;
        }
    });
}


var route_helper = function() {
    return {
        // Function for encrypting passwords WITH SALT
        // Look at the bcrypt hashing routines
        encryptPassword: (password, callback) => {
            // TODO: Implement this
            return new Promise((resolve, reject) => {
                const saltRounds = 10;
                bcrypt.hash(password, saltRounds, function(err, hash) {
                    if (err) {
                        console.error('Error hashing password:', err);
                        reject(err);
                    } else {
                        resolve(hash);
                    }
                });
            }).then(hash => {
                if (callback && typeof callback === 'function') {
                    callback(null, hash);
                }
                return hash;
            }).catch(error => {
                if (callback && typeof callback === 'function') {
                    callback(error);
                }
                throw error;
            });
        },

        // Function that validates the user is actually logged in,
        // which should only be possible if they've been authenticated
        // It can look at either an ID (as an int) or a username (as a string)
        isLoggedIn: (req, obj) => {
            if (typeof obj === 'string' || obj instanceof String)
                return req.session.username != null && req.session.username == obj;
            else
                return req.session.user_id != null && req.session.user_id == obj;
        },

        // Checks that every character is a space, letter, number, or one of the following: .,?,_
        isOK: (str) => {
            if (str == null)
                return false;
            for (var i = 0; i < str.length; i++) {
                if (!/[A-Za-z0-9 \.,?_\/-]+/.test(str[i])) {
                    console.log(`Failed character: ${str[i]}`); 
                    return false;
                }
            }
            return true;
        }        
    };
};

var encryptPassword = function(password, callback) {
    return route_helper().encryptPassword(password, callback);
}

var isOK = function(req) {
    return route_helper().isOK(req);
}

var isLoggedIn = function(req, obj) {
    return route_helper().isLoggedIn(req, obj);
}

module.exports = {
    isOK,
    isLoggedIn,
    encryptPassword, 
    uploadToS3
};