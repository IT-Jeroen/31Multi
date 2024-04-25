import {gameData} from './dataHandler.js';
import {connections} from './dataHandler.js';
import {updateGameData} from './dataHandler.js';
import {setCardsDB} from './dataHandler.js';
import {updateClient} from './dataHandler.js';
import {updateHost} from './dataHandler.js';
import {updateWaitingRoom} from './dataHandler.js';
import {removeConnection} from './dataHandler.js';
import {removePlayer} from './dataHandler.js';
// import * as dataHandler from './dataHandler.js';
import {renderApp} from './dom.js';
import {createWaitingRoom} from './dom.js';
import {startGame} from './dom.js';
// import * as dom from './dom.js'



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
            connections[0].name = playerName;
            connections[0].p = result.p;
            connections[0].c = result.c;
            connections[0].connectionId = result.c.connectionId;
            gameData.players[0].data.connectionId = result.c.connectionId;

            setConnectionEvents(result.c)
        }
        else{
            result.p.destroy();
            connections[0].c = null;
            connections[0].p = null;
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
        addNewConnection(c)
        setConnectionEvents(c)

        connections.forEach(connection => {
            pushData(connection.c, gameData, 'waiting-room');
        })

        // Update Waiting Room //
        // renderApp(createWaitingRoom())
        createWaitingRoom()
    })

    peer.on('error', err => {
        console.log('PEER ERROR:', err);
        peer.destroy();
        setupConnection(playerName);
    });

    // Create Waiting Room //
    gameData.players[0].name = playerName;
    connections[0].p = peer;
    gameData.players[0].data.connectionId = peer._id;
    gameData.isHost = playerName;
    gameData.waitingRoom.push(gameData.players[0]);
    // renderApp(createWaitingRoom())
    createWaitingRoom()

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
            console.log('CANNOT ADD CONNECTION GAME FULL:', c.metadata);
            pushData(c, null, 'game-full');
        }
        else{
            gameData.players[autoPlayerIndex].name = c.metadata;
            gameData.players[autoPlayerIndex].data.auto = false;
            gameData.players[autoPlayerIndex].data.connectionId = c.connectionId;

            connections[autoPlayerIndex].name = c.metadata;
            connections[autoPlayerIndex].connectionId = c.connectionId;
            connections[autoPlayerIndex].c = c;

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
        if (received.type === 'game-full'){
            document.getElementById('player-name-input').value = 'No Place Available at this Time';
            
        }
        // CLIENT SIDE //
        if (received.type === 'waiting-room'){
            updateGameData(received.data);
            // renderApp(createWaitingRoom())
            createWaitingRoom()
        }

        // CLIENT SIDE //
        if (received.type == 'card-data'){
            setCardsDB(received.data)
        }

        // CLIENT SIDE //
        if (received.type == 'start-game'){
            updateGameData(received.data);
            startGame()
        }

        // CLIENT SIDE //
        if (received.type == 'client-data'){
            updateClient(received.data);
            
        }

        // HOST SIDE //
        if (received.type == 'host-data'){
            if (gameData.players[0].data.connectionId == gameData.hostName){
                updateHost(received.data);

            }
        }

        // HOST SIDE //
        if (received.type == 'next-game'){
            const player = received.data;
            gameData.waitingRoom.push(player);
            updateWaitingRoom();
        }

        // HOST SIDE //
        if (received.type == 'leave-game'){
            const player = received.data
            removeConnection(player.data.connectionId);
            removePlayer(player.data.connectionId);
            updateWaitingRoom();
            
        }

        // CLIENT SIDE //
        // Connection closes before this will be executed //
        if (received.type == 'host-leaves'){
            console.log('RECIEVED HOST LEAVING')
            connections[0].p.destroy()
            window.location.reload();
            
        }
        
    });

    c.on('close', function () {
        if (gameData.players[0].data.connectionId != gameData.hostName){
            window.location.reload();
        }
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

                if (counter == 300){
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
