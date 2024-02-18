const clientName = '31-multi-client-02-id';
const hostName = '31-multi-host-id';
const varName = 'Client 02';
const message = 'Client 02 sends a message';

var lastPeerId = null;
var peer = null;
var conn = null;

// Need to exclude location and orientation from object //
// Location and orientation needs to stay local //
// Map playersObj to locationObj via names // 
const playersObj = [
    {"name":'Host', "location": 'south', 'cards-in-hand':{diamonds : 10, clubs: 'ace', clubs: 10}, 'last-dropped-cards': [],'wins': 0, 'loses': 0, 'orientation': 'matrix0', 'pass': false, 'active':false, 'auto':false},
    {"name":'Player West', "location": 'west', 'cards-in-hand':{diamonds : 10, clubs: 'ace', clubs: 10}, 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'orientation': 'matrix90Flipped', 'pass': false, 'active':false, 'auto':true},
    {"name":'Client 02', "location": 'north', 'cards-in-hand':{diamonds : 10, clubs: 'ace', clubs: 10}, 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'orientation': 'matrix180Flipped', 'pass': false, 'active':false, 'auto':true},
    {"name":'Player East', "location": 'east', 'cards-in-hand':{diamonds : 10, clubs: 'ace', clubs: 10}, 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'orientation': 'matrix270Flipped', 'pass': false, 'active':false, 'auto':true},
    {"name":'Bank', "location": 'center', 'cards-in-hand':{diamonds : 10, clubs: 'ace', clubs: 10}, 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'orientation': 'matrix0', 'pass': true, 'active':false, 'auto':false}
]

// PEER EVENT LISTENERS //

peer = new Peer(clientName, {
    debug: 2
});

peer.on('open', function (id) {
    // Workaround for peer.reconnect deleting previous id
    if (peer.id === null) {
        console.log(varName, 'Received null id from peer open');
        peer.id = lastPeerId;
    } else {
        lastPeerId = peer.id;
    }

    console.log(varName, 'Peer Open', peer)
    console.log(varName, 'ID: ' + peer.id);

    join()

});

peer.on('connection', function (c) {
    // Disallow incoming connections
    c.on('open', function() {
        c.send(varName + "Sender does not accept incoming connections");
        setTimeout(function() { c.close(); }, 500);
    });
});

peer.on('disconnected', function () {
    console.log(varName, 'Connection lost. Please reconnect');

    // // Workaround for peer.reconnect deleting previous id
    // peer.id = lastPeerId;
    // peer._lastServerId = lastPeerId;

    // Doesn't have to reconnect peer if connection is already established //
    // Should do so, in case of connection lost //
    // peer.reconnect();
});

peer.on('close', function() {
    conn = null;
    console.log(varName,'Connection destroyed');
});

peer.on('error', function (err) {
    console.log(varName, 'Error:', err);
    alert(varName+ 'Error;' + err);
});

// DELAYED (on demand) CONNECTION EVENT LISTENERS //

function join() {
    // Close old connection
    if (conn) {
        conn.close();
    }

    conn = peer.connect(hostName, {
        reliable: true
    });

    conn.metadata = clientName;

    conn.on('open', function () {
        console.log(varName, 'Connection open', conn)
        console.log(varName, "Connected to: " + conn.peer);

        // Can disconnect peer when connection is established //
        // Close the connection to the server, leaving all existing data and media connections intact. 
        // peer.disconnected will be set to true and the disconnected event will fire.
        peer.disconnect();
        peer.disconnect();


        sendMessage(conn);
        setTimeout(()=>{
            sendMessage(conn);
            endPeer(10000);
        }, 5000)

    });

    conn.on('data', function (data) {
        console.log(varName, 'Data:', data);
        const playersObj = data;
        playersObj.forEach(player => {
            console.log(varName+':', player.name);
        });

    });
    conn.on('close', function () {
        console.log(varName, 'Connection is closed')

    });
};


// SIMPLE (on demand) FUNCTION //

function sendMessage (conn) {
    console.log('sendMessage', conn);
    if (conn && conn.open) {
        // conn.send(message);
        // console.log(varName, "Send:", message, 'to', conn.peer);
        conn.send(playersObj);
        console.log(varName, 'send playersObj to', conn.peer);
    } else {
        console.log(varName, 'Connection is closed:', conn.peer);
    }
}


// Close the connection to the server and TERMINATE all existing CONNECTIONS. peer.destroyed will be set to true //
function endPeer(ms){
    setTimeout(()=>{
        peer.destroy();
        sendMessage()
    }, ms)
}