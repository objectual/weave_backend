let args = {}
process.argv.forEach(function (val, index, array) {
    let valsplit = val.split("=")
    args[valsplit[0]] = valsplit[1]
});
const io = require("socket.io-client");
const fs = require("fs");
const jwt = args['--jwt']
const socket = io(`http://127.0.0.1:8000`, {
    extraHeaders: { Authorization: `Bearer ${jwt}` }
});
const die = setTimeout(function () {
    console.log("Auth failed. No Response from server");
    console.log("Bye Bye!")
    process.exit(1)
}, 10000);

var crypto = require("crypto");
var path = require("path");

var encryptStringWithRsaPublicKey = function (toEncrypt, relativeOrAbsolutePathToPublicKey) {
    var absolutePath = path.resolve(relativeOrAbsolutePathToPublicKey);
    var publicKey = fs.readFileSync(absolutePath, "utf8");
    var buffer = Buffer.from(toEncrypt);
    var encrypted = crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
    }, buffer);
    return encrypted.toString("base64");
};

var decryptStringWithRsaPrivateKey = function (toDecrypt, relativeOrAbsolutePathtoPrivateKey) {
    var absolutePath = path.resolve(relativeOrAbsolutePathtoPrivateKey);
    var privateKey = fs.readFileSync(absolutePath, "utf8");
    var buffer = Buffer.from(toDecrypt, "base64");
    var decrypted = crypto.privateDecrypt({
        key: privateKey,
        passphrase: 'We@vE', // KEEP THIS A SECRET
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
    }, buffer);
    console.log("Decrypted: ", decrypted.toString())
    return decrypted.toString("utf8");
};
// node .\locationCheck.js --user_id=<ID> --jwt=<JWT FROM SERVER>
__main__(args['--user_id'])
//----------------------------------------- CONFIGURATION BLOCK. 

function __main__(user_id) {
    try {
        socket.on('connect', () => {
            socket.on('authorized', message => { // This is the successful connection point
                // If you don't get a response from this, you ARE NOT CONNECTED TO THE SYSTEM
                clearTimeout(die);
                console.log("Connection Authorized: ", message)

                // Updating my public key
                fs.writeFileSync(`./keys/${message.data.user.profile.phoneNo}.pub`, Buffer.from(message.data.user.encryption.pub, 'base64'));

                socketListeners()
                consumerListeners(message.data.user.profile.phoneNo, `./keys/${message.data.user.profile.phoneNo}`)
            });
        });
    } catch (e) {
        console.log(e)
        process.exit(1)
    }
}

function getUserPresence(phoneNo, callback) {
    socket.emit("presence", phoneNo, (data) => {
        return callback(data)
    })
}
function consumerListeners(myPhoneNo, privateKeyPath) {
    console.log("Consumer listener attached")
    socket.on('message', message => { // Background
        console.log(message) // The system will throw back messages whether fired my user or other users
        if (message.message.to == myPhoneNo) {
            // To check if there is a message from any other users.
            console.log("ENC TEXT: ", message.message.value)
            let decn_msg = decryptStringWithRsaPrivateKey(message.message.value, privateKeyPath)
            console.log("Message from Kafka received: ", message, decn_msg)
            if (message.message.type == "TEXT" || message.message.type == "MEDIA") {
                // NEED TO SEND BACK READ OR DELIVERED TO OTHER USER

                // get presence of message sender
                getUserPresence(message.message.from, data => {
                    console.log(data)
                    // Updating receiver's public key 
                    fs.writeFileSync(`./keys/${message.message.from}.pub`, Buffer.from(data.presence.pub, 'base64'));

                    let enc_msg = encryptStringWithRsaPublicKey("DELIVERED", `./keys/${message.message.from}.pub`)
                    console.log("Enc msg: ", enc_msg)

                    socket.emit('message', {
                        topic: message.message.from,
                        data: JSON.stringify({
                            value: enc_msg,
                            type: "STATE",
                            to: message.message.from,
                            from: myPhoneNo
                        })
                    }, (error) => {
                        if (error) {
                            console.log(error);
                        }
                    });
                })

            }
        }
    });
}
function socketListeners() {
    console.log("Messages listener attached")
    socket.on('info', message => {
        console.log("Message received: ", message)
    });
    socket.on('error', message => {
        console.log("Error received: ", message)
    });
}