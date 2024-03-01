const hostName = '31-multi-host-id';
const cardsDB = {data: null};

const players = [
    {'name':'Local', 'location': 'south', 'p2p':{'p': null, 'c': null}, 'data':{ 'id': 'local', 'cards':[], 'last-dropped-cards': [],'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':false}},
    {'name':'Auto 1', 'location': 'west', 'p2p':{'p': null, 'c': null}, 'data':{ 'id': 'auto-1', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
    {'name':'Auto 2', 'location': 'north', 'p2p':{'p': null, 'c': null}, 'data':{ 'id': 'auto-2', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
    {'name':'Auto 3', 'location': 'east', 'p2p':{'p': null, 'c': null},'data':{ 'id': 'auto-3', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
    {'name':'Bank', 'location': 'center', 'p2p':{'p': null, 'c': null}, 'data':{ 'id': 'bank', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': true, 'active':false, 'auto':false}}
]


function returnOrientationMatrix(location, flipped){
    switch (location){
        case 'south':
            if (flipped){
                return [-1,0,0,0,1,0,-1]; // 180 DEGREE Y-AXIS 0 degree z axis
            }
            return  [1,0,0,0,1,0,1]; // 0 DEGREE Y-AXIS 0 degree z axis

        case 'west':
            if (flipped){
                return [0,-1,0,1,0,0,-1]; // 180 DEGREE Y-AXIS 90 degree z axis
            }
            return [0,1,0,-1,0,0,1]; // 0 DEGREE Y-AXIS 90 degree z axis

        case 'north':
            if (flipped){
                return [1,0,0,0,-1,0,-1]; // 180 DEGREE Y-AXIS  180 degree z axis
            }
            return [-1,0,0,0,-1,0,1]; // 0 DEGREE Y-AXIS 180 degree z axis

        case 'east':
            if (flipped){
                return [0,1,0,-1,0,0,-1]; // 180 DEGREE Y-AXIS 270 degree z axis
            }
            return [0,-1,0,1,0,0,1]; // 0 DEGREE Y-AXIS 270 degree z axis

        case 'center':
            if (flipped){
                return [-1,0,0,0,1,0,-1]; // 180 DEGREE Y-AXIS 0 degree z axis
            }
            return  [1,0,0,0,1,0,1]; // 0 DEGREE Y-AXIS 0 degree z axis
    }
}

// Host players //
// players[0] will have peer, will not have a connection //
// all remote players will not have a peer, but will have a connection //

// Client Players //
// players[0] will have peer, will have a connection //
// all other players will not have peer, will not have a connection //

// const players = [
//     {'name':'Local', 'location': 'south', 'p2p':{'p': null, 'c': null}, 'data':{ 'id': 'local-player', 'cards':[], 'last-dropped-cards': [],'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':false}},
//     {'name':'Auto 1', 'location': 'west', 'p2p':{'p': null, 'c': null}, 'data':{ 'id': 'auto-1', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
//     {'name':'Auto 2', 'location': 'north', 'p2p':{'p': null, 'c': null}, 'data':{ 'id': 'auto-2', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
//     {'name':'Auto 3', 'location': 'east', 'p2p':{'p': null, 'c': null},'data':{ 'id': 'auto-3', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
//     {'name':'Bank', 'location': 'center', 'p2p':{'p': null, 'c': null}, 'data':{ 'id': 'bank', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': true, 'active':false, 'auto':false}}
// ]

// cards-in-hand = "Clubs-8" :{ x: 425, y: 870 }} // [REMOVED]
// cards: [{suit: 'clubs', label: '8'},]
// Card in CardsDB = "clubs-8": { elem: div.card, picked:false, access:true, value:8, suit:'clubs', label:'8', x: 425, y: 870} //
// const cardsDB = {data: null};
// const charValues = {'ace':11, 'king':10, 'queen':10, 'jack': 10};


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


function createPlayfield(){
    const playfield = document.createElement('div')
    playfield.id = 'playfield'
    addClassToElement(playfield, 'playfield')

    createDeck(playfield)

    renderApp(playfield)

    // Temp ??? //
    dealCardsToPlayers()
}

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
            // mapPlayerData(data.data)
            updateWaitingRoom(data.data)
            renderApp(createWaitingRoom(playersList()), c.peer.id)
        }

        if (data.type == 'players-data'){
            // mapPlayerData(data.data)
            updatePlayerData(data.data)
            logPlayersCards()
        }

        if (data.type == 'card-data'){
            setCardsDB(data.data)
            // console.log(cardsDB)
            createPlayfield()
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


function updateWaitingRoom(playersHost){
    const shuffledHost = shuffleHostArray(playersHost)
    players.forEach((player, index) => {
        player.name = shuffledHost[index].name;
        player.data = shuffledHost[index].data;
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


function shuffleHostArray(playersHost){
    const clientAtIndex = playersHost.findIndex(playerHost =>  playerHost.data.id === players[0].data.id);

    const clientFirst = playersHost.slice(clientAtIndex, 4)
    const theRest = playersHost.slice(0, clientAtIndex)
    const bank = playersHost[4]
    const shuffledHost = [...clientFirst,...theRest, bank]
    // console.log('MAP PLAYER OBJECTS:', shuffledHost)

    return shuffledHost
}



function findPlayerById(playersArr,id){
    // console.log("ID", id)
    return playersArr.find(player => player.data.id == id)
}


function updatePlayerData(playersHost){
    players.forEach(player => {
        const hostPlayer = findPlayerById(playersHost,player.data.id);
        // console.log('PLAYER FOUND', hostPlayer)
        player.data = hostPlayer.data
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

    // Can be miss-aligned ??? //
    if (cardLabelRange.length > numCards){
        console.log('Card Value Range not inline with Number of Playing Cards per Player')
    }

    const cardsInDeck = [];

    cardLabelRange.forEach(label => {
        cardSuits.forEach(suit => {
            cardsInDeck.push({suit: suit, label: label})
        })
    })

    // Randomize cards //
    for (let index = cardsInDeck.length - 1; index > 0; index--){
        
        randomIndex = Math.floor(Math.random() * (index + 1));
        [cardsInDeck[index], cardsInDeck[randomIndex]] = [cardsInDeck[randomIndex], cardsInDeck[index]]
        
      }
    // console.log(cardsInDeck);
    const pickIndex = Math.floor(Math.random() * (cardsInDeck.length - numCards));
    const  cardsInGame = cardsInDeck.slice(pickIndex, pickIndex + numCards);
    
    // console.log(cardsInGame);

    return cardsInGame;
}


// Triggered by Start Game Button click event //
function dealCards(numPlayersCards){
    const maxCards = players.length * numPlayersCards
    const cardsInGame = createRandomDeckValues(maxCards, '7');

    if (cardsInGame.length / players.length == numPlayersCards){
        addCardsToCardDB(cardsInGame)

        players.forEach((player, index) => {
            player.data.cards = [cardsInGame[index], cardsInGame[index + players.length], cardsInGame[index + 2 * players.length]]
        })
        // console.log('DEALING CARDS:', players)


        players.forEach(player => {
            pushData(player.p2p.c, playersData(), 'players-data');
            pushData(player.p2p.c, cardsDB.data, 'card-data');
        })

        logPlayersCards()
        createPlayfield()
        
    }
    else {
        console.log('CARDS ON TABLE DOES NOT MATCH PLAYERS', cardsInGame.length, players.length, numPlayersCards);
    }
}


function setCardsDB(data){
    if (!cardsDB.data){
        cardsDB.data = data
    } else{
        console.log('UPDATE CARDSDB WHAT HAPPEND ???')
    }
}


function cardToId(card){
    return `${card.suit}_${card.label}`
}


function returnCardValue(card){
    const charValues = {'ace':11, 'king':10, 'queen':10, 'jack': 10};
    let cardValue = Number(card.label);
    
    if (!cardValue){
        cardValue = charValues[card.label];
    }

    return cardValue
}


function addCardsToCardDB(cards){
    cardsDB.data = {};
    cards.forEach(card => {
        const cardID = cardToId(card);
        const cardValue = returnCardValue(card)
        cardsDB.data[cardID] = {'elem': null, 'picked':false, 'access':false, 'value':cardValue,'suit':card.suit, 'icon':card.label, 'location':'center', x: 0, y: 0};
    })
}


//////////////////////////// REDUNDANT ////////////////////////////////
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


//////////////////////////// 31 Single //////////////////////////////////////
const numPlayersCards = 3;

const backgroundElem = document.getElementById('background');
const playFieldElem = document.getElementById('playfield');

const viewPortDimension = {'width': window.innerWidth, 'height': window.innerHeight};
const viewPortScale = {'scale': 1, 'x': 1, 'y': 1}; // set the correct scale depending on screen orientation (horizontal vs vertical)

const imageDimensions = {'width': 169, 'height': 244};
const cssViewPort = {'width': 0.98, 'height': 0.98};
const buttonSpecs = {'width': 250, 'height': null, 'font': 1.5, 'padding': 1};

const winnerBadge = {'width': 160 * viewPortScale.scale, 'height': 160 * viewPortScale.scale, 'line': 160 * viewPortScale.scale, 'font': 500 * viewPortScale.scale,'border': 5};
const infoDisplay = {'width': (viewPortDimension.width * 0.6) * viewPortScale.scale, 'height': (viewPortDimension.height / 5) * viewPortScale.scale, 'padding': 20 * viewPortScale.scale, 'font': 1.5 * viewPortScale.scale,'border': 5};
const displayPos = {'x': (viewPortDimension.width * 0.5) - (infoDisplay.width * 0.5) - infoDisplay.border, 'y': (viewPortDimension.height * 0.5) - (infoDisplay.height * 0.5)};
const cardDimensions = {'width': imageDimensions.width * viewPortScale.scale, 'height': imageDimensions.height * viewPortScale.scale};
const offset = {'stacked':40 * viewPortScale.scale, 'hoverx':5, 'hovery':40 * viewPortScale.scale};
const handWidth = {'stacked': (cardDimensions.width + ((numPlayersCards -1) * offset.stacked)), 'unstacked': (numPlayersCards * cardDimensions.width)};
const btnDimensions = {'width': buttonSpecs.width * viewPortScale.scale, 'height': null, 'font': buttonSpecs.font * viewPortScale.scale, 'padding': buttonSpecs.padding * viewPortScale.scale};
const centerPos = {'x': (cssViewPort.width * viewPortDimension.width) / 2,'y': (cssViewPort.height * viewPortDimension.height) / 2};
const deckPos = {'x': centerPos.x - (cardDimensions.width / 2), 'y': centerPos.y - (cardDimensions.height /2)};
const minViewPortDimensions = {'width': ((numPlayersCards -1) * cardDimensions.height) + (numPlayersCards * cardDimensions.width) + 80, 'height': (3 * cardDimensions.height) + 80};
const zonesPos = {
    'south': (cssViewPort.height * viewPortDimension.height) - cardDimensions.height,
    'west': (cardDimensions.height - cardDimensions.width) /2,
    'north': 0,
    'east': (cssViewPort.height * viewPortDimension.width - cardDimensions.height + ((cardDimensions.height - cardDimensions.width) /2))
}

function createElem(elemType, classNames=[], idName){
    const elem = document.createElement(elemType);

    for (let className of classNames){
        addClassToElement(elem, className);
    }
    
    addIdToElement(elem, idName);

    return elem;
}


// function createDeckElements(playFieldElem){
//     const deckElems = [];
//     for (let i = 0; i < cardsInGame; i++){
//         const cardElem = createCard();

//         // Scaling 1.001 to keep images crisp //
//         cardElem.style = `transform: matrix3d(
//             ${matrix0Flipped[0]},
//             ${matrix0Flipped[1]},
//             ${matrix0Flipped[2]},
//             0,
//             ${matrix0Flipped[3]},
//             ${matrix0Flipped[4]},
//             0,
//             0,
//             ${matrix0Flipped[5]},
//             0,
//             ${matrix0Flipped[6]},
//             0,
//             ${deckPos.x},
//             ${deckPos.y},
//             0,
//             1.001
//             ); width: ${cardDimensions.width}px; height: ${cardDimensions.height}px;`; 
        
//         // // add hover mouse event //
//         // mouseOverEvent(cardElem);
//         // // add click card event //
//         // cardClickEvent(cardElem);

//         addChildElement(playFieldElem, cardElem);
//         deckElems.push(cardElem);
//     }
//     return deckElems;
// }


// Local Deck //
function createDeck(playFieldElem){
    const cardIDs = Object.keys(cardsDB.data) 
    cardIDs.forEach((cardID, index) => {
        cardsDB.data[cardID].elem = createDeckElement(cardID, deckPos, cardDimensions, cardIDs.length - index);
        cardsDB.data[cardID].location = 'center';
        cardsDB.data[cardID].x = deckPos.x;
        cardsDB.data[cardID].y = deckPos.y

        playFieldElem.appendChild(cardsDB.data[cardID].elem)
    })
}


function createDeckElement(cardID, pos, dimensions, zIndex){

    const cardElem = createCard(cardID);
    const matrix = returnOrientationMatrix('center', flipped=true)
    // Scaling 1.001 to keep images crisp //
    cardElem.style = `transform: matrix3d(
        ${matrix[0]},
        ${matrix[1]},
        ${matrix[2]},
        0,
        ${matrix[3]},
        ${matrix[4]},
        0,
        0,
        ${matrix[5]},
        0,
        ${matrix[6]},
        0,
        ${pos.x},
        ${pos.y},
        0,
        1.001
        ); width: ${dimensions.width}px; height: ${dimensions.height}px; z-index: ${zIndex};`; 
    
    // // add hover mouse event //
    // mouseOverEvent(cardElem);
    // // add click card event //
    // cardClickEvent(cardElem);
    return cardElem;
}
    

function createCard(cardID){
    
    const cardElem = createElement('div');
    addClassToElement(cardElem, 'card');

    const frontElem = createElement('div');
    addClassToElement(frontElem, 'front');
    const frontImg = createElement('img');
    frontImg.src = `./src/img/${cardID}.png`;

    const backElem = createElement('div');
    addClassToElement(backElem, 'back');
    const backImg = createElement('img');
    backImg.src = './src/img/back-blue.png';

    addChildElement(frontElem,frontImg);
    addChildElement(backElem, backImg);
    addChildElement(cardElem, frontElem);
    addChildElement(cardElem, backElem);

    return cardElem;
}


function createElement(elemType){
    return document.createElement(elemType);
}


function addClassToElement(elem, className){
    elem.classList.add(className);
    
}


function removeClassFromElement(elem, className){
    elem.classList.remove(className);
}


function addIdToElement(elem, idName){
    elem.id = idName;
}


function addChildElement(parentElem, childElem){
    parentElem.appendChild(childElem);
}

// cards-in-hands has been removed in 31Multi //
// cards is now [{suit: clubs, label: 8},]
// cardsDB now holds the x and y position of the card //

function calcCardPositions(player, stacked=true){
    // let cardsInHand = player['cards-in-hand'];
    const cardsInHand = player.data.cards
    let widthHand = 0;
    let cardOffSet = 0;

    if (stacked){
        widthHand = handWidth.stacked;
        cardOffSet = offset.stacked;
    }
    else{
        widthHand = handWidth.unstacked;
        cardOffSet = cardDimensions.width;
    }
    
    let emptySpaceX = ((cssViewPort.width * viewPortDimension.width) - widthHand) / 2;
    let emptySpaceY = ((cssViewPort.height * viewPortDimension.height) - widthHand) / 2 - (offset.stacked / 2);

    if (player.location == 'south'){
        cardsInHand.forEach((card, index) => {
            cardsDB.data[cardToId(card)].y = zonesPos.south;
            cardsDB.data[cardToId(card)].x = emptySpaceX + (index * cardOffSet);
        })
    }

    if (player.location == 'west'){
        cardsInHand.forEach((card, index) => {
            cardsDB.data[cardToId(card)].x = zonesPos.west;
            cardsDB.data[cardToId(card)].y = emptySpaceY + (index * cardOffSet);
        })

    }

    if (player.location == 'north'){
        cardsInHand.forEach((card, index) => {
            cardsDB.data[cardToId(card)].y = zonesPos.north;
            cardsDB.data[cardToId(card)].x = emptySpaceX + (index * cardOffSet);
        })

    }
    if (player.location == 'east'){
        cardsInHand.forEach((card, index) => {
            cardsDB.data[cardToId(card)].x = zonesPos.east;
            cardsDB.data[cardToId(card)].y = emptySpaceY + (index * cardOffSet);
        })

    }

    if (player.location == 'center'){
        cardsInHand.forEach((card, index) => {
            cardsDB.data[cardToId(card)].x = emptySpaceX + (index * cardOffSet);
            cardsDB.data[cardToId(card)].y = deckPos.y;
        })

    }
}


function dealCardsToPlayers(){
    
    // Calculate Card Positions //
    players.forEach(player => {
        if(player.location === 'center'){
            calcCardPositions(player, stacked=false)
        }
        else {
            calcCardPositions(player, stacked=true)
        }
    })

    // Deal Cards to Players CSS Animation //
    handOutDeckCards(300)
    
    
}


// // Actually css animation trigger //
// function repositionCards(playersArr=[]){
//     let zIndex = 1;

//     playersArr.forEach(player=> {
//         const orientation = returnOrientationMatrix(player.orientation);
//         // const cardsID = Object.keys(player['cards-in-hand'])

//         player.data.cards.forEach(card =>{
//             const cardID = cardToId(card)
//             const cardElem = cardsDB.data[cardID].elem;
//             // const cardPos = player['cards-in-hand'][cardID];

//             // Scaling 1.001 to keep images crisp //
//             cardElem.style = `transform: matrix3d(
//                 ${orientation[0]},
//                 ${orientation[1]},
//                 ${orientation[2]},
//                 0,
//                 ${orientation[3]},
//                 ${orientation[4]},
//                 0,
//                 0,
//                 ${orientation[5]},
//                 0,
//                 ${orientation[6]},
//                 0,
//                 ${cardsDB.data[cardID].x},
//                 ${cardsDB.data[cardID].y},
//                 0,
//                 1.001
//                 ); width: ${cardDimensions.width}px; height: ${cardDimensions.height}px; z-index: ${zIndex};`;
            
//             zIndex += 1;
//         });
//     })
// }

// function addDeckCardsToPlayers(){
//     const allCardElems = createDeckElements(cardsInGame, matrix0Flipped, deckPos);
//     // Create card values and id's
//     const deckCardValues = createRandomDeckValues(allCardElems.length, '7');
//     // let playersID = Object.keys(players)
//     // let players = Object.values(players); 
//     let playerIndex = 0;

//     allCardElems.forEach((cardElem, index) =>{
//         // pick a card //
//         let cardID = deckCardValues[index];

//         // Add Correct Card Images to image Elements //
//         const frontElem = cardElem.getElementsByClassName('front');
//         const frontImg = frontElem[0].children[0];
//         frontImg.src = `./src/img/${cardID}.png`;
//         const backElem = cardElem.getElementsByClassName('back');
//         const backImg = backElem[0].children[0];
//         backImg.src = './src/img/back-blue.png';
        
//         // add card to DB //
//         addCardToCardDB(cardID, cardElem);
        
//         // add card to player hand //
//         players[playerIndex]['cards-in-hand'][cardID] = {'x':deckPos.x, 'y':deckPos.y};
//         cardsDB.data[cardID].location = players[playerIndex].location;
        
//         if (players[playerIndex].name == 'Bank' || players[playerIndex].location == 'south'){
//             cardsDB.data[cardID].access = true;
//         }
        
//         playerIndex += 1;

//         if (playerIndex == players.length){
//             playerIndex = 0;
//         }
//     })  
// }


function handOutDeckCards(timing=0){
    let i = 0;
    let playerIndex = 0;
    let zIndex = 1;
    let cardIndex = 0;
    let numCardsToDeal = 0;
    
    players.forEach(player => {
        numCardsToDeal += player.data.cards.length;
    })

    const intervalID = setInterval(()=>{
        if (i == numCardsToDeal -1){
            clearInterval(intervalID);
        }
        
        let player = players[playerIndex];
        // const cardIds = Object.keys(player['cards-in-hand']);

        // const cardID = cardIds[cardIndex];
        const cardID = cardToId(player.data.cards[cardIndex]);

        // const card = player['cards-in-hand'][cardID];
        const card = cardsDB.data[cardID]

        // const orientation = player.orientation;


        let isFlipped = true
        if(player.location == 'south' || player.location == 'center'){
            isFlipped = false
        }
        const orientation = returnOrientationMatrix(player.location, isFlipped)

        const cardElem = card.elem;

        // Scaling 1.001 to keep images crisp //
        cardElem.style = `transform: matrix3d(
            ${orientation[0]},
            ${orientation[1]},
            ${orientation[2]},
            0,
            ${orientation[3]},
            ${orientation[4]},
            0,
            0,
            ${orientation[5]},
            0,
            ${orientation[6]},
            0,
            ${card.x},
            ${card.y},
            0,
            1.001
            ); width: ${cardDimensions.width}px; height: ${cardDimensions.height}px; z-index: ${zIndex};`;
        
        zIndex += 1;
        playerIndex += 1;

        if (playerIndex == players.length){
            cardIndex += 1;
            playerIndex = 0;
        }

        i += 1;
    }, timing);
}



// function dealDeckCards(timing){
//     const bankPlayer = filterPlayers('name', 'Bank', false);
//     const nonBankPlayers = filterPlayers('name', 'Bank', true);
    
//     addDeckCardsToPlayers(players);

//     // Calculate Card Positions //
//     players.forEach(player =>{
//         if (player.name == 'Bank'){
//             calcCardPositions(player, stacked=false);
//         }else{
//             calcCardPositions(player);
//         }  
//     })
    

//     handOutDeckCards(nonBankPlayers, timing);
//     setTimeout(()=>{
//         handOutDeckCards(bankPlayer, timing);
//     },(cardsInGame + 1) * timing);
// }


function loadGame(){
    // Recalculated variables when newgame() //
    // calculateVariables();

    // intro = true;
    // const playerName = document.getElementById('player-name');
    // const playerEntry = document.getElementById('player-entry');

    // // Display Elements //
    // setTimeout(()=>{
    //     if (playerEntry){
    //         players[0].name = playerName.value;
    //         players[0].auto = false;
    //         playerEntry.remove();
    //     }   
    // }, 500);

    // playCardsBtn = createPlayCardsBtn(((cssViewPort.width * viewPortDimension.width) / 2 - (handWidth.stacked / 2) - btnDimensions.width - 20), zonesPos.south + 0.5 * cardDimensions.height);
    // holdCardsBtn = createHoldCardsBtn(((cssViewPort.width * viewPortDimension.width) / 2 - (handWidth.stacked / 2) - btnDimensions.width - 20), zonesPos.south + 0.5 * cardDimensions.height);
    // swapBankBtn = createSwapBankBtn(((cssViewPort.width * viewPortDimension.width) / 2 + (handWidth.stacked / 2) + 20), zonesPos.south + 0.5 * cardDimensions.height);

    // Deal Cards //
    // setTimeout(()=>{
        
    //     dealDeckCards(300);
    // }, 1000);

    // // only after cards are dealt 
    // setTimeout(()=>{
    //     players[0].active = true;
    //     enableDisablePlayHoldBtn(holdCardsBtn, 'visible');
    //     enableDisablePlayHoldBtn(swapBankBtn, 'visible');
    // }, 8000);  
}