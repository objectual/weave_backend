let args = {}
process.argv.forEach(function (val, index, array) {
    let valsplit = val.split("=")
    args[valsplit[0]] = valsplit[1]
});
const randomMessages = require("random-messages-generator");
const io = require("socket.io-client");
const jwt = args['--jwt']
const socket = io(`http://127.0.0.1:8000`, {
    extraHeaders: { Authorization: `Bearer ${jwt}` }
});
const die = setTimeout(function () {
    console.log("Auth failed. No Response from server");
    console.log("Bye Bye!")
    process.exit(1)
}, 10000);

// node .\messageSender.js --user_id=<ID> --jwt=<JWT FROM SERVER> --receiver=<PhoneNo> --msg=<TEXT> (Optional)
//----------------------------------------- CONFIGURATION BLOCK. 
__main__();
function __main__(user_id) {
    try {
        socket.on('connect', () => {
            socket.on('authorized', message => { // This is the successful connection point
                // If you don't get a response from this, you ARE NOT CONNECTED TO THE SYSTEM
                clearTimeout(die);
                console.log("Connection Authorized: ", message)
                socketListeners()
                consumerListeners()
                sendMessages()
            });
        });
    } catch (e) {
        console.log(e)
        process.exit(1)
    }
}
function sendMessages() {
    console.log("Message sender started...")
    socket.emit("presence", (args['--receiver'], (user) => {
        console.log(user)
        setInterval(() => {
            socket.emit('message', {
                topic: args['--receiver'],
                data: {
                    value: args['--msg'] != null ? args['--msg'] : randomMessages.randomMsg(),
                    type: "TEXT"
                }
            }, (error) => {
                if (error) {
                    console.log(error);
                }
            });
        }, 100 * 1000) //sec to ms
    }))
}
function consumerListeners() {
    console.log("Consumer listener attached")
    socket.on('message', message => { // Background
        console.log("Message from Kafka received: ", message)
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