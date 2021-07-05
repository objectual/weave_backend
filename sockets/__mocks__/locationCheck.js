let args = {}
process.argv.forEach(function (val, index, array) {
    let valsplit = val.split("=")
    args[valsplit[0]] = valsplit[1]
});
const randomLocation = require('random-location')
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
            socket.on('error', message => {
                console.log("Error received: ", message)
            });
            socket.on('authorized', message => { // This is the successful connection point
                // If you don't get a response from this, you ARE NOT CONNECTED TO THE SYSTEM
                clearTimeout(die);
                console.log("Connection Authorized: ", message)
                socketListeners()
                if (message.data.handshake == true) {
                    startLocationUpdating(user_id)
                }
            });
        });
    } catch (e) {
        console.log(e)
        process.exit(1)
    }
}

const P = {
    longitude: 67.0600895, latitude: 24.9263031
}
const R = 1000 //meters
function startLocationUpdating(user_id) {
    console.log("Location updater started...")
    setInterval(() => {
        let { longitude, latitude } = randomLocation.randomCircumferencePoint(P, R);
        socket.emit('location-update', { user_id, lat: latitude, long: longitude }, (error) => {
            if (error) {
                console.log(error);
            }
        });
    }, 100 * 1000) //sec to ms
}
function socketListeners() {
    console.log("Messages listener attached")
    socket.on('message', message => {
        console.log("Message received: ", message)
    });
}