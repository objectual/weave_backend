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
    return decrypted.toString("utf8");
};

// node .\messageReceiver.js --jwt=<JWT FROM SERVER>
//----------------------------------------- CONFIGURATION BLOCK.
// This simulates a user going online and receiving old messages and marks as delivered(✓D) and as read(✓R). 
__main__()

function __main__() {
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
        /* SAMPLE RESPONSE
        {
          text: 'message',
          message: '{"value":"gyApweZu6/Cy8ag94q8RVdjlSAtIxk242RBse/XPDMbEjERdTyDJmY855El6R+e+Gn98d+Q+djGIzJtCpsqIynZS4tRWM52HWqIjvpyvFY3yV3WvtGO0ZCtzSuhAX40ZCOz4F2AXPUvRj5fLV6awctpsW46BdyLXw9CKDeXpp4Q=","type":"TEXT","to":"923343664550","from":"923323070980","id":"5275cf9c-a235-40c5-a562-b3a1fadc9b19","createdAt":1626461272.564}',
          time: 1626461272592
        }
        */
        message = JSON.parse(message.message)
        if (message.to == myPhoneNo) {
            // To check if there is a message from any other users.
            let decn_msg = decryptStringWithRsaPrivateKey(message.value, privateKeyPath)
            console.log("Message from Kafka received: ", message, "Decrypted: ", decn_msg)  // <-- This is the actual item to save 
            if (message.type == "TEXT" || message.type == "MEDIA") {
                // NEED TO SEND BACK READ OR DELIVERED TO OTHER USER

                // get presence of message sender
                getUserPresence(message.from, data => {
                    /* SAMPLE RESPONSE
                    {
                      phoneNo: '923343664550',
                      firstName: 'Suzy',
                      lastName: 'Adams',
                      city: 'london',
                      country: 'uk',
                      birthday: '1990-01-18T19:00:00.000Z',
                      birthYearVisibility: true,
                      about: 'Smarter than the world',
                      profileImage: 'https://res.cloudinary.com/weavemasology/image/upload/v1623680410/images/user_wghiyv.png',
                      locationRange: 200,
                      locationVisibility: true,
                      trend: 0,
                      presence: {
                        date: 1626460980.824,
                        presence: 'ONLINE',
                        pub: 'LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JR0pBb0dCQU5YQmU4M3RLM3cxS2FzWFdXYjRSU0NkUDhyK3pTek12Z3ljY2laMVkzSktqWnF4YnpQYTRoQWEKTkwwd2lTc1RRSFVEVXRxeGYwalJiUkRtemRSVm1ZeEhBenJraFg5bU94SGJJM2RBdjR5djdRWCtsZG5KM2wxQwo2NGZBazVyZEE0QlkxczVmNmdGWHA0L3RwNTQ3cmpGSHVsdm1oT0w2VjhIQWpKckFjOUY1QWdNQkFBRT0KLS0tLS1FTkQgUlNBIFBVQkxJQyBLRVktLS0tLQo='
                      }
                    }
                    */

                    // Updating receiver's public key 
                    fs.writeFileSync(`./keys/${message.from}.pub`, Buffer.from(data.presence.pub, 'base64'));

                    // Mark message as delivered(✓D)
                    let enc_msg_delivered = encryptStringWithRsaPublicKey("DELIVERED", `./keys/${message.from}.pub`)

                    socket.emit('message', {
                        topic: message.from,
                        data: JSON.stringify({
                            pid: message.id, // Need to attach this broadcast which message received state change
                            value: enc_msg_delivered,
                            type: "STATE",
                            to: message.from,
                            from: myPhoneNo
                        })
                    }, (error) => {
                        if (error) {
                            console.log(error);
                        }
                    });


                    // Mark message as read(✓R)
                    let enc_msg_read = encryptStringWithRsaPublicKey("READ", `./keys/${message.from}.pub`)

                    socket.emit('message', {
                        topic: message.from,
                        data: JSON.stringify({
                            pid: message.id, // Need to attach this broadcast which message received state change
                            value: enc_msg_read,
                            type: "STATE",
                            to: message.from,
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