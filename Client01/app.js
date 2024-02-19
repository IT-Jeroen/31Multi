console.log('Hello Client01');

// When no name is given, will auto generate an id //
// const peer = new Peer('31-multi-client01-id');

// console.log('Client01 PEER', peer);

// peer.on('open', (id) => {
//     console.log('Client01 Peer ID: ', id)
//     // Peer ID:  da799da1-f99b-4465-9b12-0abc092e4eae
//     // changes on every new connection (page refresh) //
// })

// Start Connection to host //
// const conn = peer.connect('31-multi-host00-id');

// // conn.on('open', (id) => {
// //     console.log('CLIENT 01 Peer ID: ', id);

// conn.on('open', () => {

// 	// Receive messages
// 	conn.on('data', (data) => {
// 	  console.log('CLEINT 01 Received', data);
// 	});

// 	// Send messages
// 	conn.send('Hello! From Client01');
//   });



// // Recieve Connection
// conn.on('connection', (conn) => {
//     console.log('CLIENT 01 CONNECTION', conn);
//     conn.on('data', (data) => {
//         console.log('CLEINT01 RECIEVGED DATA:', data);
//     })
// });

// // CONNECT //
// var conn = peer.connect('31-multi-host00-id');
// // on open will be launch when you successfully connect to PeerServer
// conn.on('open', function(){
//   // here you have conn.id
//   conn.send('hi! from Client01');
// });

// // RECIEVE //
// peer.on('connection', function(conn) {
//     conn.on('data', function(data){
//       // Will print 'hi!'
//       console.log('Recieved Data Cleint01:',data);
//     });
//   });

// // CONNECT //
// var conn = peer.connect('31-multi-host00-id');
// console.log('Cleint01 Connection:', conn);

// // on open will be launch when you successfully connect to PeerServer
// conn.on('open', function(){
//     conn.on('data', function(data){
//         // RECIEVE //
//         console.log('Recieved Data Client01:',data);
//     })
//   // here you have conn.id
//   conn.send('hi! from Client01');
// });

// // Start Connection to client01 //
// peer.connect('31-multi-host00-id');

// peer.on('connection', (conn) => {
//     console.log('Client01 Conn:', conn)
//     // Recieve //
//     conn.on('data', (data) => {
//         console.log('Client01 Recieved Data:', data);
//     })

//     // Send //
//     conn.send('Client01 Sends a message');
// })

// console.log('### Client Peer', peer);





var lastPeerId = null;
var peer = null; // Own peer object
var peerId = '31-multi-client01-test-id';
var conn = null;
var connectTo = '31-multi-host00-test-id';
var msg = 'This is a message from Cleint 01'


function initialize() {
    // Create own peer object with connection to shared PeerJS server
    peer = new Peer(peerId, {
        debug: 2
    });

    // Set Event Listeners //
    peer.on('open', function (id) {
        // Workaround for peer.reconnect deleting previous id
        if (peer.id === null) {
            console.log('Client01: Received null id from peer open');
            peer.id = lastPeerId;
        } else {
            lastPeerId = peer.id;
        }

        console.log('Client01 ID: ' + peer.id);
        // join() // Only working here (And with connect button) // // Is open default state of a new peer ?? //
        
    });

    peer.on('connection', function (c) {
        // Disallow incoming connections
        c.on('open', function() {
            c.send("Sender does not accept incoming connections");
            setTimeout(function() { c.close(); }, 500);
        });
    });

    peer.on('disconnected', function () {
        console.log('Cleint01: Connection lost. Please reconnect');
        peer.id = lastPeerId;
        peer._lastServerId = lastPeerId;
        peer.reconnect();
    });

    peer.on('close', function() {
        conn = null;
        console.log('Client01: Connection destroyed');
    });

    peer.on('error', function (err) {
        console.log('Cleint01 Error',err);
        alert('Client01' + err);
    });

};

function join() {
    // Close old connection
    if (conn) {
        conn.close();
    }

    // Create connection to destination peer specified in the input field
    conn = peer.connect(connectTo, {
        reliable: true
    });

    conn.on('open', function () {
        console.log("Cleint01 Connected to: " + conn.peer);
    });

    // Handle incoming data (messages only since this is the signal sender)
    conn.on('data', function (data) {
        console.log('Client01: Reiceved Data', data)
    });
    conn.on('close', function () {
        console.log('Client01: Connection closed')
    });
};

// Send message
function sendMessage(msg) {
    if (conn && conn.open) {
        conn.send(msg);
        console.log("Client01: Message Sent: " + msg);
       
    } else {
        console.log('Cleint01: Connection is closed');
    }
};

initialize();

setTimeout(() => {
    join();
},2000)

setTimeout(() => {
    sendMessage(msg);
},5000)
