console.log('Hello Host00');

// When no name is given, will auto generate an id //
// const peer = new Peer('31-multi-host00-id');

// console.log('Host00 Peer', peer);

// peer.on('open', (id) => {
//     console.log('Host00 Peer ID: ', id)
//     // Peer ID:  da799da1-f99b-4465-9b12-0abc092e4eae
//     // changes on every new connection (page refresh) //
// })

// // Start Connection to client01 //
// const conn = peer.connect('31-multi-client01-id');

// // conn.on('open', (id) => {
// //     console.log('HOST Peer ID: ', id);

// conn.on('open', () => {
// 	// Receive messages
// 	conn.on('data', (data) => {
// 	  console.log('HOST 00 Received', data);
// 	});

// 	// Send messages
// 	conn.send('Hello! From Host00');
//   });


// // Recieve Connection
// conn.on('connection', (conn) => {
//     console.log('HOST CONNECTION:', conn);
//     conn.on('data', (data) => {
//         console.log('HOST00 RECIEVED DATA', data)
//     })
// });

// // CONNECT //
// var conn = peer.connect('31-multi-client01-id');
// // on open will be launch when you successfully connect to PeerServer
// conn.on('open', function(){
//   // here you have conn.id
//   conn.send('hi! from Host00');
// });

// // RECIEVE //
// peer.on('connection', function(conn) {
//     conn.on('data', function(data){
//       // Will print 'hi!'
//       console.log('Recieved Data Host00:',data);
//     });
//   });

// // CONNECT //
// var conn = peer.connect('31-multi-client01-id');
// console.log('Host00 Connection:', conn);
// // on open will be launch when you successfully connect to PeerServer
// conn.on('open', function(){
//     conn.on('data', function(data){
//         // RECIEVE //
//         console.log('Recieved Data Host00:',data);
//     })
//   // here you have conn.id
//   conn.send('hi! from Host00');
// });

// // Start Connection to client01 //
// peer.connect('31-multi-client01-id');

// peer.on('connection', (conn) => {
//     // Recieve //
//     conn.on('data', (data) => {
//         console.log('Host00 Recieved Data:', data);
//     })

//     // Send //
//     conn.send('Host00 Sends a message');
// })

// console.log('### Host00 Peer', peer);






var lastPeerId = null;
var peer = null; // own peer object
var conn = null;
var hostId = '31-multi-host00-test-id';
var msg = 'This is a message from Host00'

// var sender01 = '31-multi-sender01-test-id';


 function initialize() {
    // Create own peer object with connection to shared PeerJS server
    peer = new Peer(hostId, {
        debug: 2
    });

    peer.on('open', function (id) {
        // Workaround for peer.reconnect deleting previous id
        if (peer.id === null) {
            console.log('Host00: Received null id from peer open');
            peer.id = lastPeerId;
        } else {
            lastPeerId = peer.id;
        }

        console.log('Host00 ID: ' + peer.id);
    });

    peer.on('connection', function (c) {
        // Allow only a single connection
        if (conn && conn.open) {
            c.on('open', function() {
                c.send("Host00: Already connected to another client");
                setTimeout(function() { c.close(); }, 500);
            });
            return;
        }

        conn = c;
        console.log("Host00: Connected to: " + conn.peer);
        ready();
    });

    peer.on('disconnected', function () {
        console.log('Host00: Connection lost. Please reconnect');
        peer.id = lastPeerId;
        peer._lastServerId = lastPeerId;
        peer.reconnect();
    });

    peer.on('close', function() {
        conn = null;
        console.log('Host 00: Connection destroyed');
    });

    peer.on('error', function (err) {
        console.log('Host00: Error', err);
        alert('Host00:' + err);
    });
};


function ready() {
    conn.on('data', function (data) {
        console.log('Host00: Recieved Data', data);
    });

    conn.on('close', function () {
        console.log("Host00: Awaiting connection...");
        conn = null;
    });
}

// Send message
function sendMessage(msg) {
    if (conn && conn.open) {
        conn.send(msg);
        console.log("Host00: Message Sent: " + msg);
    } else {
        console.log('Host00: Connection is closed');
    }
}

initialize();

setTimeout(()=> {
    sendMessage(msg)
},5000)



