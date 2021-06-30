let args = {}
process.argv.forEach(function (val, index, array) {
    let valsplit = val.split("=")
    args[valsplit[0]] = valsplit[1]
});
const request = require("request");
const io = require("socket.io-client");
const jwt = args['--jwt']
const socket = io(`http://127.0.0.1:8000`, {
    extraHeaders: { Authorization: `Bearer ${jwt}` }
});
function __main__(user_id, lat, long) {
    try {
        socketListeners()
        socket.on('connect', () => {
            socket.emit('location-update', { user_id, lat, long }, (error) => {
                console.log("DONE")
                if (error) {
                    alert('ERROR')
                    console.log(error);
                }
            });
        });
    } catch (e) {
        console.log(e)
        process.exit(1)
    }
}

function socketListeners() {
    console.log("Messages listener attached")
    socket.on('message', message => {
        console.log("Message received: ", message)
    });
}

// node .\locationCheck.js --user_id=1 --lat=20 --long=23 --jwt=<JWT FROM SERVER>
__main__(args['--user_id'], args['--lat'], args['--long'])