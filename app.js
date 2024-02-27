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

// p2p: sending peer or connection via connection.send() raises error due to formatting //
// Duplicate Naming: maybe add connectionId with name to differentiate duplicate names //

const players = [
    {"name":'Local Player', "p2p":{"peer": null, "connection": null}, "data":{"location": 'south', "cards":[],'cards-in-hand':{}, 'last-dropped-cards': [],'wins': 0, 'loses': 0, 'orientation': matrix0, 'pass': false, 'active':false, 'auto':false}},
    {"name":'Auto 1', "p2p":{"peer": null, "connection": null}, "data":{"location": 'west', "cards":[], 'cards-in-hand':{}, 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'orientation': matrix90Flipped, 'pass': false, 'active':false, 'auto':true}},
    {"name":'Auto 2', "p2p":{"peer": null, "connection": null}, "data":{"location": 'north', "cards":[], 'cards-in-hand':{}, 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'orientation': matrix180Flipped, 'pass': false, 'active':false, 'auto':true}},
    {"name":'Auto 3', "p2p":{"peer": null, "connection": null},"data":{"location": 'east', "cards":[], 'cards-in-hand':{}, 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'orientation': matrix270Flipped, 'pass': false, 'active':false, 'auto':true}},
    {"name":'Bank', "p2p":{"peer": null, "connection": null}, "data":{"location": 'center', "cards":[], 'cards-in-hand':{}, 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'orientation': matrix0, 'pass': true, 'active':false, 'auto':false}}
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
            // console.log('HOST FOUND')
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

    const peer = new Peer(hostName, {
        debug: 2
        })

    peer.on('connection', (c)=>{

        addNewConnection(c)

        players.forEach(clientPlayer => {
            // pushData(clientPlayer.connection, players) // TypeError: t is undefined, binarypack.ts:331:20 //
            // pushData(clientPlayer.p2p.connection, JSON.stringify(players)) // TypeError: cyclic object value app.js:149:52 //
            pushData(clientPlayer.p2p.connection, playersData())
        })

        renderApp(createWaitingRoom(playersList(), hostName))
    })

    peer.on('error', err => {console.log('PEER ERROR:', err)});

    players[0].name = playerName;
    players[0].p2p.peer = peer;
    renderApp(createWaitingRoom(playersList(), hostName));

}



function addNewConnection(connection){
    // console.log('ADD NEW CLIENT CONNECTION:', connection.connectionId)

    const newPlayer = players.some(playerHost => {
        // console.log("PLAYERHOST:", playerHost)
        if (playerHost.p2p.connection){
            
            if (playerHost.p2p.connection.connectionId === connection.connectionId){
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
            players[autoPlayerIndex].data.auto = false;
            // console.log('ADD PLAYERS:', players)
        }
        
    }
    else {
        console.log('NOT A NEW CONNECTION:', connection.metadata)
    }
}


function setConnectionEvents(c) {

    c.on('data', function (playersHost) {
        console.log("Data recieved:", playersHost);
        mapPlayerData(playersHost)
        renderApp(createWaitingRoom(playersList()), c.peer.id)
    });

    c.on('close', function () {
        console.log('Connection reset, Awaiting connection...');
        // remove from array //
        connections = connections.filter(i=> i.name != c.peer);
        // console.log('Connections:', connections);
    });
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


//////////////////////////////////// WAITNG ROOM /////////////////////////////////////////////////

function createWaitingRoom(data, peerName){
    const waitingRoomDiv = document.createElement('div');
    waitingRoomDiv.id = 'waiting-room';
    waitingRoomDiv.append(...createPlayerList(data))

    if (peerName === hostName){
        const startGameBtn = document.createElement('button');
        startGameBtn.innerText ='Start Game';

        startGameBtn.addEventListener('click', () => {
            dealCards(3)
        })
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

function playersList(){
    return players.map(player => player.name)
}


function playersData(){
    return players.map(player => {
        return {"name": player.name, "data": player.data}
    })
}


function mapPlayerData(playersHost){
    const playerClientIndex = playersHost.findIndex(playerHost => playerHost.name === players[0].name)
    // Prevent Duplicate Name Problems (Doesn't work to the lack of p2p data from host)
    // const playerClientIndex = playersHost.findIndex(playerHost => playerHost.p2p.connection.connectionId === players[0].p2p.connection.connectionId)

    // [0,1,2,3, not 4] //
    // shift to the left //
    // [0 - playerClientIndex, 1 - playerClientIndex]
    const a = playersHost.slice(playerClientIndex, 4)
    const b = playersHost.slice(0, playerClientIndex)
    const c = playersHost[4]
    const d = [...a,...b, c]
    console.log('MAP PLAYER OBJECTS:', d)

    players.forEach((player, index) => {
        player.name = d[index].name;
        player.data = d[index].data;
    })
}


////////////////////////////////// DEAL CARDS ///////////////////////////////////////////

const charValues = {'ace':11, 'king':10, 'queen':10, 'jack': 10};
// Card in CardsDB = "Clubs-8": Object { elem: div.card, picked:false, access:true, value:8, symbol:'Clubs', icon:'8'} //
const cardsDB = {}; 


function createRandomDeckValues(numCards, minValue='2', maxValue='ace'){
    const cardValues = ['2','3','4','5','6','7','8','9','10','jack', 'queen', 'king', 'ace'];
    const cardSymbols = ['club', 'diamond', 'heart', 'spade'];

    const min = cardValues.indexOf(minValue);
    const max = cardValues.indexOf(maxValue)+1;
    const cardRange = cardValues.slice(min, max);

    let randomIndex = 0;

    // Can be miss-aligned //
    if (cardRange.length > numCards){
        console.log('Card Value Range not inline with Number of Playing Cards per Player')
    }

    const cardsInGame = [];

    cardRange.forEach(value => {
        cardSymbols.forEach(symbol => {
            // cardsInGame.push(`${symbol}_${value}`);
            cardsInGame.push({symbol: symbol, value: value})
        })
    })

    // Randomize cards //
    for (let index = cardsInGame.length - 1; index > 0; index--){
        
        randomIndex = Math.floor(Math.random() * (index + 1));
        [cardsInGame[index], cardsInGame[randomIndex]] = [cardsInGame[randomIndex], cardsInGame[index]]
        
      }
    // console.log(cardsInGame);
    const pickIndex = Math.floor(Math.random() * (cardsInGame.length - numCards));
    const cardsInDeck = cardsInGame.slice(pickIndex, pickIndex + numCards);
    
    // console.log(cardsInDeck);

    return cardsInDeck;
}

function dealCards(numPlayersCards){
    // const numPlayersCards = 3;
    const maxCards = players.length * numPlayersCards
    const cardsOnTable = createRandomDeckValues(maxCards, '7');

    if (cardsOnTable.length / players.length == numPlayersCards){
        players.forEach((player, index) => {
            player.data.cards = [cardsOnTable[index], cardsOnTable[index + players.length], cardsOnTable[index + 2 * players.length]]
        })
        console.log('DEALING CARDS:', players)
    }
    else {
        console.log('CARDS ON TABLE DOES NOT MATCH PLAYERS', cardsOnTable, players.length, numPlayersCards);
    }
}