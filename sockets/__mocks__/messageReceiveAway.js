let args = {}
process.argv.forEach(function (val, index, array) {
    let valsplit = val.split("=")
    args[valsplit[0]] = valsplit[1]
}); 
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
                socketListeners()
                consumerListeners()
            });
        });
    } catch (e) {
        console.log(e)
        process.exit(1)
    }
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