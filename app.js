const hostName = '31-multi-host-id';

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


// Host players //
// players[0] will have peer, will not have a connection //
// all remote players will not have a peer, but will have a connection //

// Client Players //
// players[0] will have peer, will have a connection //
// all other players will not have peer, will not have a connection //

const players = [
    {'name':'Local Player', 'location': 'south', 'orientation': matrix0, 'p2p':{'p': null, 'c': null}, 'data':{ 'id': null, 'cards':[], 'last-dropped-cards': [],'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':false}},
    {'name':'Auto 1', 'location': 'west', 'orientation': matrix90Flipped, 'p2p':{'p': null, 'c': null}, 'data':{ 'id': null, 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
    {'name':'Auto 2', 'location': 'north', 'orientation': matrix180Flipped, 'p2p':{'p': null, 'c': null}, 'data':{ 'id': null, 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
    {'name':'Auto 3', 'location': 'east', 'orientation': matrix270Flipped, 'p2p':{'p': null, 'c': null},'data':{ 'id': null, 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
    {'name':'Bank', 'location': 'center', 'orientation': matrix0, 'p2p':{'p': null, 'c': null}, 'data':{ 'id': null, 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': true, 'active':false, 'auto':false}}
]

// cards-in-hand = "Clubs-8" :{ x: 425, y: 870 }} // [REMOVED]
// cards: [{suit: 'clubs', label: '8'},]
// Card in CardsDB = "clubs-8": { elem: div.card, picked:false, access:true, value:8, suit:'clubs', label:'8', x: 425, y: 870} //
const cardsDB = {};
const charValues = {'ace':11, 'king':10, 'queen':10, 'jack': 10};


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

            players[0].name = playerName;
            players[0].p2p.p = result.p;
            players[0].p2p.c = result.c;
            players[0].data.id = result.c.connectionId;

            setConnectionEvents(result.c)
            renderApp(createWaitingRoom(playersList(),result.p.id));
        }
        else{
            result.p.destroy();
            players[0].p2p.c = null;
            players[0].p2p.p = null;
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
            pushData(clientPlayer.p2p.c, playersData(), 'waiting-room')
        })

        renderApp(createWaitingRoom(playersList(), hostName))
    })

    peer.on('error', err => {console.log('PEER ERROR:', err)});

    players[0].name = playerName;
    players[0].p2p.p = peer;
    players[0].data.id = hostName;
    renderApp(createWaitingRoom(playersList(), hostName));

}



function addNewConnection(c){
    // console.log('ADD NEW CLIENT CONNECTION:', connection.connectionId)

    const excistingPlayer = players.some(playerHost => {
        // console.log("PLAYERHOST:", playerHost)
        if (playerHost.p2p.c){
            
            if (playerHost.p2p.c.connectionId === c.connectionId){
                return true
            }
        }
        
    })

    if(!excistingPlayer){
        const autoPlayerIndex = players.findIndex(playerHost => playerHost.data.auto)
        
        if (autoPlayerIndex == -1){
            console.log('CANNOT ADD CONNECTION:', c.metadata)
            // c.send('CANNOT ADD CLIENT')
        }
        else{
            players[autoPlayerIndex].name = c.metadata;
            players[autoPlayerIndex].p2p.c = c;
            players[autoPlayerIndex].data.auto = false;
            players[autoPlayerIndex].data.id = c.connectionId;
            // console.log('ADD PLAYERS:', players)
        }
        
    }
    else {
        console.log('NOT A NEW CONNECTION:', c.metadata)
    }
}


// Client Side (Only one connection) //
function setConnectionEvents(c) {

    c.on('data', function (data) {
        // console.log("Data recieved:", data);
        if (data.type === 'waiting-room'){
            mapPlayerData(data.data)
            renderApp(createWaitingRoom(playersList()), c.peer.id)
        }

        if (data.type == 'players-data'){
            mapPlayerData(data.data)
            logPlayersCards()
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
function pushData(c, data, type){
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
    const clientAtIndex = playersHost.findIndex(playerHost =>  playerHost.data.id === players[0].data.id);

    const a = playersHost.slice(clientAtIndex, 4)
    const b = playersHost.slice(0, clientAtIndex)
    const c = playersHost[4]
    const d = [...a,...b, c]
    // console.log('MAP PLAYER OBJECTS:', d)

    players.forEach((player, index) => {
        player.name = d[index].name;
        player.data = d[index].data;
    })
}


////////////////////////////////// DEAL CARDS ///////////////////////////////////////////


function createRandomDeckValues(numCards, minValue='2', maxValue='ace'){
    const cardLabels = ['2','3','4','5','6','7','8','9','10','jack', 'queen', 'king', 'ace'];
    const cardSuits = ['club', 'diamond', 'heart', 'spade'];

    const min = cardLabels.indexOf(minValue);
    const max = cardLabels.indexOf(maxValue)+1;
    const cardLabelRange = cardLabels.slice(min, max);

    let randomIndex = 0;

    // Can be miss-aligned //
    if (cardLabelRange.length > numCards){
        console.log('Card Value Range not inline with Number of Playing Cards per Player')
    }

    const cardsInGame = [];

    cardLabelRange.forEach(label => {
        cardSuits.forEach(suit => {
            // cardsInGame.push(`${symbol}_${value}`);
            cardsInGame.push({suit: suit, label: label})
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
    const maxCards = players.length * numPlayersCards
    const cardsOnTable = createRandomDeckValues(maxCards, '7');

    if (cardsOnTable.length / players.length == numPlayersCards){
        players.forEach((player, index) => {
            player.data.cards = [cardsOnTable[index], cardsOnTable[index + players.length], cardsOnTable[index + 2 * players.length]]
        })
        // console.log('DEALING CARDS:', players)

        players.forEach(player => {
            pushData(player.p2p.c, playersData(), 'players-data')
        })

        logPlayersCards()
        
    }
    else {
        console.log('CARDS ON TABLE DOES NOT MATCH PLAYERS', cardsOnTable.length, players.length, numPlayersCards);
    }
}


function logPlayersCards(){
    console.log('---------- Players Cards --------------')
    players.forEach(player => {
        console.log('# ' + player.name)
        player.data.cards.forEach(card => {
            console.log(`${card.suit}-${card.label}`)
        })
        console.log('#')
    })
    console.log('---------------------------------------')
}