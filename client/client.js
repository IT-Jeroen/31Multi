const clientName = '31-multi-client-01-id';
const hostName = '31-multi-host-id';
const varName = 'Client 01';
const message = 'Client 01 sends a message';

var lastPeerId = null;
var peer = null;
var conn = null;


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

    conn.on('open', function () {
        console.log(varName, 'Connection open', conn)
        console.log(varName, "Connected to: " + conn.peer);

        // Can disconnect peer when connection is established //
        // Close the connection to the server, leaving all existing data and media connections intact. 
        // peer.disconnected will be set to true and the disconnected event will fire.
        peer.disconnect();
        peer.disconnect();


        sendMessage();
        setTimeout(()=>{
            sendMessage();
            endPeer(10000);
        }, 5000)

    });

    conn.on('data', function (data) {
        console.log(varName, 'Data:', data)

    });
    conn.on('close', function () {
        console.log(varName, 'Connection is closed')

    });
};


// SIMPLE (on demand) FUNCTION //

function sendMessage() {
    if (conn && conn.open) {
        
        conn.send(message);
        console.log(varName, "Sent: " + message);
        
    } else {
        console.log(varName, 'Connection is closed');
    }
};

// Close the connection to the server and TERMINATE all existing CONNECTIONS. peer.destroyed will be set to true //
function endPeer(ms){
    setTimeout(()=>{
        peer.destroy();
        sendMessage()
    }, ms)
}