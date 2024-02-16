const hostName = '31-multi-host-id';
const varName = 'Host';
const message = 'Host sends a message';
;
var lastPeerId = null;
var peer = null; 
var peerId = null;
var conn = null;

peer = new Peer(hostName, {
    debug: 2
});


// PEER EVENT LISTENERS //

peer.on('open', function (id) {
    // Workaround for peer.reconnect deleting previous id
    if (peer.id === null) {
        console.log(varName, 'Received null id from peer open');
        peer.id = lastPeerId;
    } else {
        lastPeerId = peer.id;
    }
    console.log(varName, 'Peer Open:', peer);
    console.log(varName, 'ID: ' + peer.id);
});


peer.on('connection', function (c) {
    if (conn && conn.open) {
        c.on('open', function() {
            c.send(varName + "Already connected to another client");
            setTimeout(function() { c.close(); }, 500);
        });
        return;
    }

    conn = c;
    console.log(varName, "Connected to: " + conn.peer);
    console.log(varName, 'Connection:', conn)
    
    ready();
});


peer.on('disconnected', function () {
    console.log(varName, 'Connection lost. Please reconnect');

    // Workaround for peer.reconnect deleting previous id
    peer.id = lastPeerId;
    peer._lastServerId = lastPeerId;
    peer.reconnect();
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

function ready() {
    conn.on('open', function () {
        console.log(varName, 'Connection open', conn)
        console.log(varName, "Connected to: " + conn.peer);

        sendMessage();
    });

    conn.on('data', function (data) {
        console.log(varName, "Data recieved:", data);
    });

    conn.on('close', function () {
        console.log(varName, 'Connection reset, Awaiting connection...');
        conn = null;
    });
}


// SIMPLE (on demand) FUNCTION //

function sendMessage () {
    console.log('sendMessage')
    if (conn && conn.open) {
        conn.send(message);
        console.log(varName, "Send: " + message)
    } else {
        console.log(varName, 'Connection is closed');
    }
};