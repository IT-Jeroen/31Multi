// (function () {

    const clientName = '31-multi-client-01-id';
    const hostName = '31-multi-host-id';
    const varName = 'Client 01';
    const message = 'Client 01 sends a message';

    var lastPeerId = null;
    var peer = null; // own peer object
    var conn = null;
    // var recvIdInput = document.getElementById("receiver-id");
    // var status = document.getElementById("status");
    // var message = document.getElementById("message");
    // var goButton = document.getElementById("goButton");
    // var resetButton = document.getElementById("resetButton");
    // var fadeButton = document.getElementById("fadeButton");
    // var offButton = document.getElementById("offButton");
    // var sendMessageBox = document.getElementById("sendMessageBox");
    // var sendButton = document.getElementById("sendButton");
    // var clearMsgsButton = document.getElementById("clearMsgsButton");
    // var connectButton = document.getElementById("connect-button");
    // var cueString = "<span class=\"cueMsg\">Cue: </span>";

    /**
     * Create the Peer object for our end of the connection.
     *
     * Sets up callbacks that handle any events related to our
     * peer object.
     */
    function initialize() {
        // // Create own peer object with connection to shared PeerJS server
        // peer = new Peer(null, {
        //     debug: 2
        // });

        // Create own peer object with connection to shared PeerJS server
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

        });

        peer.on('connection', function (c) {
            // Disallow incoming connections
            c.on('open', function() {
                c.send(varName + "Sender does not accept incoming connections");
                setTimeout(function() { c.close(); }, 500);
            });
        });

        peer.on('disconnected', function () {
            // status.innerHTML = "Connection lost. Please reconnect";
            console.log(varName, 'Connection lost. Please reconnect');

            // Workaround for peer.reconnect deleting previous id
            peer.id = lastPeerId;
            peer._lastServerId = lastPeerId;
            peer.reconnect();
        });

        peer.on('close', function() {
            conn = null;
            // status.innerHTML = "Connection destroyed. Please refresh";
            console.log(varName,'Connection destroyed');
        });

        peer.on('error', function (err) {
            console.log(varName, 'Error:', err);
            alert(varName+ 'Error;' + err);
        });
    };

    /**
     * Create the connection between the two Peers.
     *
     * Sets up callbacks that handle any events related to the
     * connection and data received on it.
     */
    function join() {
        // Close old connection
        if (conn) {
            conn.close();
        }

        // Create connection to destination peer specified in the input field
        conn = peer.connect(hostName, {
            reliable: true
        });

        conn.on('open', function () {
            // status.innerHTML = "Connected to: " + conn.peer;
            console.log(varName, 'Connection open', conn)
            console.log(varName, "Connected to: " + conn.peer);

            sendMessage();
            // // Check URL params for comamnds that should be sent immediately
            // var command = getUrlParam("command");
            // if (command)
            //     conn.send(command);
        });
        // Handle incoming data (messages only since this is the signal sender)
        conn.on('data', function (data) {
            console.log(varName, 'Data:', data)
            // addMessage("<span class=\"peerMsg\">Peer:</span> " + data);
        });
        conn.on('close', function () {
            console.log(varName, 'Connection is closed')
            // status.innerHTML = "Connection closed";
        });
    };

    /**
     * Get first "GET style" parameter from href.
     * This enables delivering an initial command upon page load.
     *
     * Would have been easier to use location.hash.
     */
    // function getUrlParam(name) {
    //     name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    //     var regexS = "[\\?&]" + name + "=([^&#]*)";
    //     var regex = new RegExp(regexS);
    //     var results = regex.exec(window.location.href);
    //     if (results == null)
    //         return null;
    //     else
    //         return results[1];
    // };

    /**
     * Send a signal via the peer connection and add it to the log.
     * This will only occur if the connection is still alive.
     */
    //  function signal(sigName) {
    //     if (conn && conn.open) {
    //         conn.send(sigName);
    //         console.log(sigName + " signal sent");
    //         addMessage(cueString + sigName);
    //     } else {
    //         console.log('Connection is closed');
    //     }
    // }

    // goButton.addEventListener('click', function () {
    //     signal("Go");
    // });
    // resetButton.addEventListener('click', function () {
    //     signal("Reset");
    // });
    // fadeButton.addEventListener('click', function () {
    //     signal("Fade");
    // });
    // offButton.addEventListener('click', function () {
    //     signal("Off");
    // });

    // function addMessage(msg) {
    //     var now = new Date();
    //     var h = now.getHours();
    //     var m = addZero(now.getMinutes());
    //     var s = addZero(now.getSeconds());

    //     if (h > 12)
    //         h -= 12;
    //     else if (h === 0)
    //         h = 12;

    //     function addZero(t) {
    //         if (t < 10)
    //             t = "0" + t;
    //         return t;
    //     };

    //     message.innerHTML = "<br><span class=\"msg-time\">" + h + ":" + m + ":" + s + "</span>  -  " + msg + message.innerHTML;
    // };

    // function clearMessages() {
    //     message.innerHTML = "";
    //     addMessage("Msgs cleared");
    // };

    // Listen for enter in message box
    // sendMessageBox.addEventListener('keypress', function (e) {
    //     var event = e || window.event;
    //     var char = event.which || event.keyCode;
    //     if (char == '13')
    //         sendButton.click();
    // });

    // Send message
    function sendMessage() {
        if (conn && conn.open) {
            
            conn.send(message);
            console.log(varName, "Sent: " + message);
            
        } else {
            console.log(varName, 'Connection is closed');
        }
    };

    // Clear messages box
    // clearMsgsButton.addEventListener('click', clearMessages);
    // Start peer connection on click
    // connectButton.addEventListener('click', join);

    // Since all our callbacks are setup, start the process of obtaining an ID
    initialize();
    // join();
    setTimeout(()=> {join()},3000);
    // sendMessage();
// })();