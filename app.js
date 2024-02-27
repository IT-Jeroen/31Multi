// 0 DEGREE Y-AXIS //
const matrix0 = [1,0,0,0,1,0,1]; // 0 degree z axis
const matrix90 = [0,1,0,-1,0,0,1]; // 90 degree z axis
const matrix180 = [-1,0,0,0,-1,0,1]; // 180 degree z axis
const matrix270 = [0,-1,0,1,0,0,1]; // 270 degree z axis

// 180 DEGREE Y-AXIS //
const matrix0Flipped = [-1,0,0,0,1,0,-1]; // 0 degree z axis
const matrix90Flipped = [0,-1,0,1,0,0,-1]; // 90 degree z axis
const matrix180Flipped = [1,0,0,0,-1,0,-1]; // 180 degree z axis
const matrix270Flipped = [0,1,0,-1,0,0,-1]; // 270 degree z axis

const players = [
    {"name":'Local Player', "p2p":{"peer": null, "connection": null}, "data":{"location": 'south', 'cards-in-hand':{}, 'last-dropped-cards': [],'wins': 0, 'loses': 0, 'orientation': matrix0, 'pass': false, 'active':false, 'auto':false}},
    {"name":'Auto 1', "p2p":{"peer": null, "connection": null}, "data":{"location": 'west', 'cards-in-hand':{}, 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'orientation': matrix90Flipped, 'pass': false, 'active':false, 'auto':true}},
    {"name":'Auto 2', "p2p":{"peer": null, "connection": null}, "data":{"location": 'north', 'cards-in-hand':{}, 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'orientation': matrix180Flipped, 'pass': false, 'active':false, 'auto':true}},
    {"name":'Auto 3', "p2p":{"peer": null, "connection": null},"data":{"location": 'east', 'cards-in-hand':{}, 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'orientation': matrix270Flipped, 'pass': false, 'active':false, 'auto':true}},
    {"name":'Bank', "p2p":{"peer": null, "connection": null}, "data":{"location": 'center', 'cards-in-hand':{}, 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'orientation': matrix0, 'pass': true, 'active':false, 'auto':false}}
]

const hostName = '31-multi-host-id';
const connections = []



/////////////////////////// GAME INTRO PAGE /////////////////////////////////

function createNameInput(cb) {
    const wrapper = document.createElement('div')
    
    const label = document.createElement('label')
    label.innerText = 'Enter Name'
    
    const input = document.createElement('input')
    input.type = 'text';
    
    const button = document.createElement('button')
    button.type = 'button';
    button.innerText = 'Next';
   
    button.addEventListener('click', e => {
        cb(input.value);
        button.innerText = 'Checking for host...';
        button.disabled = true;

    })

    
    wrapper.append(label, input, button)
    
    return wrapper;
}

// CallBack function //
function handleNameSubmitted(playerName) {
    setupConnection(playerName);
}


function renderApp(component) {
    document.getElementById('root').replaceChildren(component);
}

// cb = handleNameSubmitted
// component = createNameInput())
renderApp(createNameInput(handleNameSubmitted));


////////////////////////// CHECK FOR EXISTING HARD CODED HOST ////////////////////////////////

function testHost(playerName){
    return new Promise((resolve, reject) => {
        const peer = new Peer(null, {
            debug: 2
        })

        peer.on('open', function (id) {
            // console.log('TEST PEER', peer)
            const connection = peer.connect(hostName, {
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


function setupConnection(playerName){
    const p2pObject = testHost(playerName)

    p2pObject
    .then(result => {
        if (!result.ishost){
            console.log('HOST FOUND')
            // connections.push({name:playerName, c: c})

            players[0].name = playerName
            players[0].p2p.peer = result.p
            players[0].p2p.connection = result.c

            setConnectionEvents(result.c)
            renderApp(createWaitingRoom(playersList(),result.p.id));
        }
        else{
            result.p.destroy();
            connections.length = 0;
            setAsHost(playerName);
        }
        
    })
    .catch(err => {
        console.log('PEER ERROR', err); 
    }) 
}


function setAsHost(playerName){
    // console.log('SET AS HOST')
    // connections.push({name:playerName, c: null});
    // renderApp(createWaitingRoom(playersList(), hostName));

    const peer = new Peer(hostName, {
        debug: 2
        })

    peer.on('connection', (c)=>{
        // connections.push({name: c.metadata, c: c});
        // console.log('Connections:', connections);

        // connections.forEach(item => {
        //     pushData(item.c, playersList())
        // })

        addNewConnection(c)

        players.forEach(clientPlayer => {
            // pushData(clientPlayer.connection, players) // TypeError: t is undefined, binarypack.ts:331:20 //
            // pushData(clientPlayer.p2p.connection, JSON.stringify(players)) // TypeError: cyclic object value app.js:149:52 //
            pushData(clientPlayer.p2p.connection, playersData())
        })

        renderApp(createWaitingRoom(playersList(), hostName))
    })

    peer.on('error', err => {console.log('PEER ERROR:', err)});

    // connections.push({name:playerName, c: null});
    players[0].name = playerName;
    players[0].p2p.peer = peer;
    renderApp(createWaitingRoom(playersList(), hostName));

}



function addNewConnection(connection){
    // console.log('ADD NEW CLIENT CONNECTION:', connection)

    const newPlayer = players.some(playerHost => {
        // console.log("PLAYERHOST:", playerHost)
        if (playerHost.p2p.connection){
            
            if (playerHost.p2p.connection.id === connection.id){
                return true
            }
        }
        
    })

    if(!newPlayer){
        const autoPlayerIndex = players.findIndex(playerHost => playerHost.data.auto)
        
        if (autoPlayerIndex == -1){
            console.log('CANNOT ADD CONNECTION:', connection.metadata)
            // c.send('CANNOT ADD CLIENT')
        }
        else{
            players[autoPlayerIndex].name = connection.metadata;
            players[autoPlayerIndex].p2p.connection = connection;
            console.log('ADD PLAYERS:', players)
        }
        
    }
    else {
        console.log('NOT A NEW CONNECTION:', connection.metadata)
    }
}


function setConnectionEvents(c) {

    c.on('data', function (playersHost) {
        console.log("Data recieved:", playersHost);
        mapPlayerObjects(playersHost)
        // mapPlayerObjects(JSON.parse(playersHost))
        renderApp(createWaitingRoom(playersList()), c.peer.id)
    });

    c.on('close', function () {
        console.log('Connection reset, Awaiting connection...');
        // remove from array //
        connections = connections.filter(i=> i.name != c.peer);
        // console.log('Connections:', connections);
    });

    // connections.push({name:playerName, c: c})
}


// Delayed Response in case connection is closed when still setting up in the background //
function pushData(c, data){
    if (c){
        if (!c._open){
            let counter = 0;
        
            const intervalID = setInterval(()=>{
                if (c._open){
                    clearInterval(intervalID);
                    c.send(data)
                }
                counter += 1;

                if (counter == 100){
                    clearInterval(intervalID);
                    console.log('PUSH DATA TIMEOUT')
                }

            }, 100)
        }
        else {
            c.send(data);
        }
    }
}


function playersList(){
    // return connections.map(item => item.name)
    return players.map(player => player.name)
}

function playersData(){
    return players.map(player => {
        return {"name": player.name, "data": player.data}
    })
}


//////////////////////////////////// WAITNG ROOM /////////////////////////////////////////////////

function createWaitingRoom(data, peerName){
    const waitingRoomDiv = document.createElement('div');
    waitingRoomDiv.id = 'waiting-room';
    waitingRoomDiv.append(...createPlayerList(data))

    if (peerName === hostName){
        const startGameBtn = document.createElement('button');
        startGameBtn.innerText ='Start Game';
        waitingRoomDiv.appendChild(startGameBtn);
    }
    
    return waitingRoomDiv
}


function createPlayerList(playerNames) {
    // console.log('PLAYER NAMES', playerNames);
    return playerNames.map(player => createPlayerLabel(player))
}


function createPlayerLabel(player) {
    const playerDiv = document.createElement('div');
    const playerHeading = document.createElement('h2');
    playerHeading.innerText = player;
    playerDiv.appendChild(playerHeading);
    return playerDiv;
}


function removeElements(elems=[]){
    elems.forEach(elem => {
        if (elem){
            elem.remove()
        }
    })
    
}

///////////////////////////////////// PLAYERS //////////////////////////////////////////

// function mapPlayerObjects(playersHost){
//     players.map(playerClient => {
//         return playersHost.filter(playerHost => playerClient.name === playerHost.name)
//     })
// }

// function mapPlayerObjects(playersHost){
//     players.map(playerClient => {
//         const mapPlayer = playersHost.filter(playerHost => playerClient.name === playerHost.name)
//         playerClient.data = mapPlayer.data
//         return playerClient
//     })
// }

function mapPlayerObjects(playersHost){
    const playerClientIndex = playersHost.findIndex(playerHost => playerHost.name === players[0].name)
    // [0,1,2,3, not 4] //
    // shift to the left //
    // [0 - playerCLientIndex, 1 - playerClientIndex]
}