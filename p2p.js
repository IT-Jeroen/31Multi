import {gameData} from './dataHandler.js';
import * as dataHandler from './dataHandler.js';
import * as dom from './dom.js'

function testHost(playerName){
    return new Promise((resolve, reject) => {
        const peer = new Peer(null, {
            debug: 2
        })

        peer.on('open', function (id) {
            const connection = peer.connect(gameData.hostName, {
                reliable: true
            })
            connection.metadata = playerName;

            peer.on('error', err => {
                if (err.type === 'peer-unavailable'){
                    resolve({p: peer, c: null, ishost: true})
                }
                else {
                    reject(err)
                }
            })
            connection.on('open', ()=> resolve({p: peer, c:connection, ishost: false}))

        })
    })
}


export function setupConnection(playerName){
    const p2pObject = testHost(playerName)

    p2pObject
    .then(result => {
        if (!result.ishost){
            gameData.players[0].name = playerName;
            dataHandler.connections[0].name = playerName;
            dataHandler.connections[0].p = result.p;
            dataHandler.connections[0].c = result.c;
            dataHandler.connections[0].connectionId = result.c.connectionId;
            gameData.players[0].data.connectionId = result.c.connectionId;

            setConnectionEvents(result.c)
            dom.renderApp(dom.createWaitingRoom())
        }
        else{
            result.p.destroy();
            dataHandler.connections[0].c = null;
            dataHandler.connections[0].p = null;
            setAsHost(playerName);
        }
        
    })
    .catch(err => {
        console.log('PEER ERROR', err); 
    }) 
}


function setAsHost(playerName){
    const peer = new Peer(gameData.hostName, {
        debug: 2
        })

    peer.on('connection', (c)=>{
        // gameData.singlePlayer = false; moved to initializeGame()
        addNewConnection(c)
        setConnectionEvents(c)

        dataHandler.connections.forEach(connection => {
            pushData(connection.c, gameData, 'waiting-room');
        })

        // Update Waiting Room //
        dom.renderApp(dom.createWaitingRoom())
    })

    peer.on('error', err => {console.log('PEER ERROR:', err)});

    // Create Waiting Room //
    gameData.players[0].name = playerName;
    dataHandler.connections[0].p = peer;
    gameData.players[0].data.connectionId = peer._id;
    gameData.isHost = playerName;
    gameData.waitingRoom.push(gameData.players[0]);
    dom.renderApp(dom.createWaitingRoom())

}


function addNewConnection(c){
    const excistingPlayer = gameData.players.some(player => {
        if (player.connectionId){
            
            if (player.connectionId === c.connectionId){
                return true
            }
        }
        
    })

    if(!excistingPlayer){
        const autoPlayerIndex = gameData.players.findIndex(player => player.data.auto)
        
        if (autoPlayerIndex == -1){
            console.log('CANNOT ADD CONNECTION:', c.metadata)
            // c.send('CANNOT ADD CLIENT')
        }
        else{
            gameData.players[autoPlayerIndex].name = c.metadata;
            gameData.players[autoPlayerIndex].data.auto = false;
            gameData.players[autoPlayerIndex].data.connectionId = c.connectionId;

            dataHandler.connections[autoPlayerIndex].name = c.metadata;
            dataHandler.connections[autoPlayerIndex].connectionId = c.connectionId;
            dataHandler.connections[autoPlayerIndex].c = c;

            // add to waiting room //
            gameData.waitingRoom.push(gameData.players[autoPlayerIndex]);
        }
        
    }
    else {
        console.log('NOT A NEW CONNECTION:', c.metadata)
    }
}


function setConnectionEvents(c) {

    c.on('data', function (received) {
        // CLIENT SIDE //
        if (received.type === 'waiting-room'){
            dataHandler.updateGameData(received.data);
            dom.renderApp(dom.createWaitingRoom())
        }

        // CLIENT SIDE //
        if (received.type == 'card-data'){
            dataHandler.setCardsDB(received.data)
        }

        // CLIENT SIDE //
        if (received.type == 'start-game'){
            dataHandler.updateGameData(received.data);
            dom.startGame()
        }

        // CLIENT SIDE //
        if (received.type == 'client-data'){
            dataHandler.updateClient(received.data);
            
        }

        // HOST SIDE //
        if (received.type == 'host-data'){
            if (gameData.players[0].data.connectionId == gameData.hostName){
                dataHandler.updateHost(received.data);

            }
        }
        // // HOST SIDE //
        if (received.type == 'next-game'){
            const player = received.data;
            gameData.waitingRoom.push(player);
            // const connect = dataHandler.connections.filter(connection => connection.connectionId == player.data.connectionId)[0];
            // pushData(connect.c, gameData, 'waiting-room');
    
            // Update Waiting Room //
            // dom.renderApp(dom.createWaitingRoom())
            // gameData.waitingRoom.forEach(playerName => {
                
            //     if (playerName == gameData.players[0].name){
            //         dom.renderApp(dom.createWaitingRoom())
            //     }
            //     else {
            //         const connect = dataHandler.connections.filter(connection => connection.connectionId == player.data.connectionId)[0];
            //         pushData(connect.c, gameData, 'waiting-room');
            //     }
                

            // })
            dataHandler.updateWaitingRoom();
        }

        // HOST SIDE //
        if (received.type == 'leave-game'){
            console.log('LEAVE GAME P2P', received)
            const player = received.data
            // remove client connection //
            dataHandler.removeConnection(player.data.connectionId);
            
            // remove client from players //
            dataHandler.removePlayer(player.data.connectionId);

            // MAKE A WAITING ROOM FLAG ??? //

            // forces host into waiting room //
            // dom.renderApp(dom.createWaitingRoom());

            // will force all clients into waiting room //
            dataHandler.connections.forEach(connection => {
                pushData(connection.c, gameData, 'waiting-room');
            })
        }

        // if (received.type == 'client-leaves'){
        //     // remove client connection //
        //     dataHandler.connections.forEach(connection => {
        //         pushData(connection.c, gameData, 'waiting-room');
        //     })
        // }

        if (received.type == 'host-leaves'){
            // go back to starting screen //
            window.location.reload();
            
        }
        
    });

    c.on('close', function () {
        console.log('Connection reset, Awaiting connection...');
        // set player connection to null
        // set player data.id to null
        // set player to auto ???
        // rename player to auto ???
    });
}



// Delayed Response in case connection is closed when still setting up in the background //
export function pushData(c, data, type){
    if (c){
        if (!c._open){
            let counter = 0;
        
            const intervalID = setInterval(()=>{
                if (c._open){
                    clearInterval(intervalID);
                    c.send({type: type, data: data})
                }
                counter += 1;

                if (counter == 100){
                    clearInterval(intervalID);
                    console.log('PUSH DATA TIMEOUT')
                }

            }, 100)
        }
        else {
            c.send({type: type, data: data});
        }
    }
}

function clientLeaves(){

}

function hostLeaves(){

}