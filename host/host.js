const hostName = '31-multi-host-id';
const varName = 'Host';
const message = 'Host sends a message';

var lastPeerId = null;
var peer = null; 
var peerId = null;
var connections = [];

// Need to exclude location and orientation from object //
// Location and orientation needs to stay local //
// Map playersObj to locationObj via names // 
const playersObj = [
    {"name":'Host', "location": 'south', 'cards-in-hand':{diamonds : 10, clubs: 'ace', clubs: 10}, 'last-dropped-cards': [],'wins': 0, 'loses': 0, 'orientation': 'matrix0', 'pass': false, 'active':false, 'auto':false},
    {"name":'Player West', "location": 'west', 'cards-in-hand':{diamonds : 10, clubs: 'ace', clubs: 10}, 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'orientation': 'matrix90Flipped', 'pass': false, 'active':false, 'auto':true},
    {"name":'Player North', "location": 'north', 'cards-in-hand':{diamonds : 10, clubs: 'ace', clubs: 10}, 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'orientation': 'matrix180Flipped', 'pass': false, 'active':false, 'auto':true},
    {"name":'Player East', "location": 'east', 'cards-in-hand':{diamonds : 10, clubs: 'ace', clubs: 10}, 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'orientation': 'matrix270Flipped', 'pass': false, 'active':false, 'auto':true},
    {"name":'Bank', "location": 'center', 'cards-in-hand':{diamonds : 10, clubs: 'ace', clubs: 10}, 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'orientation': 'matrix0', 'pass': true, 'active':false, 'auto':false}
]


// PEER OBJECT //
// Is the connection between ICE/STUN/TURN Server //
peer = new Peer(hostName, {
    debug: 2
});



// PEER EVENT LISTENERS //

// Emitted when a connection to the PeerServer is established //
peer.on('open', function (id) {
    console.log(varName, 'ID OBject', id);
    // Workaround for peer.reconnect deleting previous id
    if (peer.id === null) {
        console.log(varName, 'Received null id from peer open');
        peer.id = lastPeerId;
    } else {
        lastPeerId = peer.id;
    }
    console.log(varName, 'Peer Open:', peer);
    console.log(varName, 'Peer ID: ' + peer.id);
});

// Emitted when a new data connection is established from a remote peer //
// Callback function with a dataConnection Object //
peer.on('connection', function (c) {
    // if (conn && conn.open) {
    //     c.on('open', function() {
    //         c.send(varName + "Already connected to another client");
    //         setTimeout(function() { c.close(); }, 500);
    //     });
    //     return;
    // }

    connections.push({name: c.peer, c: c});
    console.log('Connections:', connections);
    console.log(varName, "Connected to: " + c.peer);
    console.log(varName, "MetaData: " + c.metadata);
    console.log(varName, 'Connection:', c)
    
    if (newConnection(c.peer)){
        ready(c);
    }
    
});

// Emitted when the peer is disconnected from the signalling server, either manually //
// or because the connection to the signalling server was lost. When a peer is disconnected, //
// its existing connections will stay alive, but the peer cannot accept or create any new connections //
peer.on('disconnected', function () {
    console.log(varName, 'Connection lost. Please reconnect');
    
    // Don't need this if you know / seet the peer ID manually //
    // // Workaround for peer.reconnect deleting previous id
    // peer.id = lastPeerId;
    // peer._lastServerId = lastPeerId;

    // Doesn't have to reconnect peer if connection is already established //
    // Should do so, in case of connection lost //
    // peer.reconnect();
});


peer.on('close', function() {
    conn = null;
    console.log(varName, 'Connection destroyed');
});


peer.on('error', function (err) {
    console.log(varName, 'Error:', err);
    alert(varName + 'Error:' + err);
});


// DELAYED (on demand) CONNECTION EVENT LISTENERS //

function ready(conn) {

    conn.on('open', function () {
        console.log(varName, 'Connection open', conn)
        console.log(varName, "Connected to: " + conn.peer);
        
        // Can disconnect peer when connection is established //
        // Close the connection to the server, leaving all existing data and media connections intact. 
        // peer.disconnected will be set to true and the disconnected event will fire.

        // Need to keep open or otherwise 2nd Client cannot connect //
        // peer.disconnect();
        
        sendMessage(conn);
        setTimeout(()=>{
            sendMessage(conn)
            endPeer(10000, conn)
        },5000)
    });

    conn.on('data', function (data) {
        console.log(varName, "Data recieved:", data);
    });

    conn.on('close', function () {
        console.log(varName, 'Connection reset, Awaiting connection...');
        // remove from array //
        connections = connections.filter(c=> c.name != conn.peer);
        console.log('Connections:', connections);
    });
}

// Bit of a Hack to Prevent sending double messages //
function newConnection(name){
    connections.forEach(c =>{
        if (c.name === name){
            console.log(varName, 'Name Found in Connections:', name)
            return false
        }
    })
    return true
}


// SIMPLE (on demand) FUNCTION //

function sendMessage (conn) {
    console.log('sendMessage');
    if (conn && conn.open) {
        // conn.send(message);
        // console.log(varName, "Send:", message, 'to', conn.peer);
        conn.send(playersObj);
        console.log(varName, 'send playersObj to', conn.peer);
    } else {
        console.log(varName, 'Connection is closed:', conn.peer);
    }
};

// Close the connection to the server and TERMINATE all existing CONNECTIONS. peer.destroyed will be set to true //
function endPeer(ms, conn){
    setTimeout(()=>{
        peer.destroy();
        sendMessage(conn)
    }, ms)
}

