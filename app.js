const hostName = '31-multi-host-id';
const vw = window.innerWidth // Need to be set at start of the game
const vh = window.innerHeight // Need to be set at start of the game
const cardsDB = {width: 169, height: 244, data: null}; // width and height could differ per player

const players = [
    {'name':'Local', 'location': 'south', 'p2p':{'p': null, 'c': null}, 'data':{ 'id': 'local', 'cards':[], 'last-dropped-cards': [],'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':false}},
    {'name':'Auto 1', 'location': 'west', 'p2p':{'p': null, 'c': null}, 'data':{ 'id': 'auto-1', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
    {'name':'Auto 2', 'location': 'north', 'p2p':{'p': null, 'c': null}, 'data':{ 'id': 'auto-2', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
    {'name':'Auto 3', 'location': 'east', 'p2p':{'p': null, 'c': null},'data':{ 'id': 'auto-3', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
    {'name':'Bank', 'location': 'center', 'p2p':{'p': null, 'c': null}, 'data':{ 'id': 'bank', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': true, 'active':false, 'auto':false}}
]


function returnOrientationMatrix(location, flipSide){
    switch (location){
        case 'south':
            if (flipSide == 'closed'){
                return [-1,0,0,0,1,0,-1]; // 180 DEGREE Y-AXIS 0 degree z axis
            }
            return  [1,0,0,0,1,0,1]; // 0 DEGREE Y-AXIS 0 degree z axis

        case 'west':
            if (flipSide == 'closed'){
                return [0,-1,0,1,0,0,-1]; // 180 DEGREE Y-AXIS 90 degree z axis
            }
            return [0,1,0,-1,0,0,1]; // 0 DEGREE Y-AXIS 90 degree z axis

        case 'north':
            if (flipSide == 'closed'){
                return [1,0,0,0,-1,0,-1]; // 180 DEGREE Y-AXIS  180 degree z axis
            }
            return [-1,0,0,0,-1,0,1]; // 0 DEGREE Y-AXIS 180 degree z axis

        case 'east':
            if (flipSide == 'closed'){
                return [0,1,0,-1,0,0,-1]; // 180 DEGREE Y-AXIS 270 degree z axis
            }
            return [0,-1,0,1,0,0,1]; // 0 DEGREE Y-AXIS 270 degree z axis

        case 'center':
            if (flipSide == 'closed'){
                return [-1,0,0,0,1,0,-1]; // 180 DEGREE Y-AXIS 0 degree z axis
            }
            return  [1,0,0,0,1,0,1]; // 0 DEGREE Y-AXIS 0 degree z axis
    }
}


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


// function createPlayfield(){
//     const playfield = document.createElement('div')
//     playfield.id = 'playfield'
//     addClassToElement(playfield, 'playfield')

//     createDeck(playfield)

//     renderApp(playfield)

//     dealCardsToPlayers()
// }

function createPlayfield(cb){
    const playfield = document.createElement('div')
    playfield.id = 'playfield'
    addClassToElement(playfield, 'playfield')

    cb(playfield)

    return playfield
}


/// Doesn't Apply to Clients, only Host ///
function initializeGame(){
    prepCards(3)
    .then(cardsInGame => {
        // dealCards => pushData => c.send(data) should catch errors and return a promise //
        dealCards(cardsInGame);
        startGame()
    })
    .catch(err => console.log(err)) 
}


function startGame(){
    renderApp(createPlayfield(createDeck))
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
            updateWaitingRoom(data.data)
            renderApp(createWaitingRoom(playersList()), c.peer.id)
        }

        if (data.type == 'players-data'){
            updatePlayerData(data.data)
        }

        if (data.type == 'card-data'){
            setCardsDB(data.data)
        }

        if (data.type == 'start-game'){
            updatePlayerData(data.data)
            createPlayfield()
            // temp hardcoded activation //
            players[0].data.active=true
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
            initializeGame()
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
            // cardsInDeck.push({suit: suit, label: label})
            cardsInDeck.push(`${suit}_${label}`)
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


// Host function //
function prepCards(numPlayerCards){
    return new Promise((resolve, reject) => {
        const maxCards = players.length * numPlayerCards
        const cardsInGame = createRandomDeckValues(maxCards, '7');
        if (cardsInGame.length / players.length == numPlayerCards){
            addCardsToCardDB(cardsInGame);
            players.forEach(player => {
                pushData(player.p2p.c, cardsDB.data, 'card-data');
            })
            resolve(cardsInGame)
        }
        else {
            console.log('CARDS ON TABLE DOES NOT MATCH PLAYERS', cardsInGame.length, players.length, numPlayerCards);
            reject(new Error('CARDS ON TABLE DOES NOT MATCH PLAYERS'))
        }
    })
}

// Host function //
function dealCards(cardsInGame){

    players.forEach((player, index) => {
        player.data.cards = [cardsInGame[index], cardsInGame[index + players.length], cardsInGame[index + 2 * players.length]]
    })
    // console.log('DEALING CARDS:', players)

    players.forEach(player => {
        pushData(player.p2p.c, playersData(), 'start-game');
        // temp hardcoded activation //
        players[0].data.active=true
    })
}


//////////////////////////////////////////// Cards DB ////////////////////////////////////////////////////////


function setCardsDB(data){
    if (!cardsDB.data){
        cardsDB.data = data
    } else{
        console.log('UPDATE CARDSDB WHAT HAPPEND ???')
    }
}


// function old_cardToId(card){
//     return `${card.suit}_${card.label}`
// }


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
        // const cardID = card;
        const cardValue = returnCardValue(card)
        // cardsDB.data[cardID] = {elem: null, picked: false, hover: false, access: false, value: cardValue, suit: card.suit, icon: card.label, location: 'center', x: 0, y: 0};
        const splitID = card.split('_')
        cardsDB.data[card] = {elem: null, picked: false, hover: false, access: false, value: cardValue, suit: splitID[0], icon: splitID[1], location: 'center', x: 0, y: 0};
    })
}


//////////////////////////// 31 Single //////////////////////////////////////

// function startGame(){
//     prepCards(3)
//     .then(cardsInGame => {
//         dealCards(cardsInGame);
//         createPlayfield()
//     })
//     .catch(err => console.log(err)) 
// }


function createElem(elemType, classNames=[], idName){
    const elem = document.createElement(elemType);

    for (let className of classNames){
        addClassToElement(elem, className);
    }
    
    addIdToElement(elem, idName);

    return elem;
}


// Local Function //
function createDeck(playFieldElem){
    const centerPos = {'x': vw / 2,'y': vh / 2};
    const deckPos = {'x': centerPos.x - (cardsDB.width / 2), 'y': centerPos.y - (cardsDB.height /2)};
    const cardIDs = Object.keys(cardsDB.data) 
    cardIDs.forEach((cardID, index) => {

        const cardElem = createCardElem(cardID);
        
        //// Card Event Listeners ////
        mouseOverEvent(cardElem, cardID);
        cardClickEvent(cardElem, cardID);

        cardsDB.data[cardID].elem = cardElem
        cardsDB.data[cardID].location = 'center';
        cardsDB.data[cardID].x = deckPos.x;
        cardsDB.data[cardID].y = deckPos.y;

        playFieldElem.appendChild(cardsDB.data[cardID].elem)

        let zIndex = cardIDs.length - index
        const matrix = returnOrientationMatrix('center', 'closed')
        setCssTransform(cardsDB.data[cardID], matrix, zIndex);

    })
}


function setCssTransform(card, matrix, zIndex){
    // Scaling 1.001 to keep images crisp //
    card.elem.style = `transform: matrix3d(
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
        ${card.x},
        ${card.y},
        0,
        1.001
        ); width: ${cardsDB.width}px; height: ${cardsDB.height}px; z-index: ${zIndex};`; 

}
    

function createCardElem(cardID){
    
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


function setCardsPosition(player, stacked=true){
    const numPlayersCards = player.data.cards.length
    const offsetStacked = 40
    const handWidth = {'stacked': (cardsDB.width + ((numPlayersCards -1) * offsetStacked)), 'unstacked': (numPlayersCards * cardsDB.width)};
    const zonesPos = {
        'south': vh - cardsDB.height,
        'west': (cardsDB.height - cardsDB.width) /2,
        'north': 0,
        'east': (vw - cardsDB.height + ((cardsDB.height - cardsDB.width) /2))
    }
    
    const cardsInHand = player.data.cards
    let widthHand = 0;
    let cardOffSet = 0;

    if (stacked){
        widthHand = handWidth.stacked;
        cardOffSet = offsetStacked;
    }
    else{
        widthHand = handWidth.unstacked;
        cardOffSet = cardsDB.width;
    }
    
    let emptySpaceX = (vw - widthHand) / 2;
    let emptySpaceY = (vh - widthHand) / 2 - (offsetStacked / 2);

    if (player.location == 'south'){
        cardsInHand.forEach((card, index) => {
            cardsDB.data[card].y = zonesPos.south;
            cardsDB.data[card].x = emptySpaceX + (index * cardOffSet);
        })
    }

    if (player.location == 'west'){
        cardsInHand.forEach((card, index) => {
            cardsDB.data[card].x = zonesPos.west;
            cardsDB.data[card].y = emptySpaceY + (index * cardOffSet);
        })

    }

    if (player.location == 'north'){
        cardsInHand.forEach((card, index) => {
            cardsDB.data[card].y = zonesPos.north;
            cardsDB.data[card].x = emptySpaceX + (index * cardOffSet);
        })

    }
    if (player.location == 'east'){
        cardsInHand.forEach((card, index) => {
            cardsDB.data[card].x = zonesPos.east;
            cardsDB.data[card].y = emptySpaceY + (index * cardOffSet);
        })

    }

    if (player.location == 'center'){
        cardsInHand.forEach((card, index) => {
            cardsDB.data[card].x = emptySpaceX + (index * cardOffSet);
            cardsDB.data[card].y = (vh / 2) - (cardsDB.height / 2);
        })

    }
}


// Local Function //
function dealCardsToPlayers(){
    
    // Calculate Player Cards Positions //
    players.forEach(player => {
        if(player.location === 'center'){
            setCardsPosition(player, stacked=false)
        }
        else {
            setCardsPosition(player, stacked=true)
        }
    })

    // Deal Cards to Players CSS Animation //
    handOutDeckCards(300)
    
}


// Actuall Trigger for the CSS Animation //
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
        const cardID = player.data.cards[cardIndex];
        const card = cardsDB.data[cardID]

        let flipSide = 'closed';
        if(player.location == 'south' || player.location == 'center'){
            flipSide = 'open';
            card.access = true
        }

        const matrix = returnOrientationMatrix(player.location, flipSide)
        setCssTransform(card, matrix, zIndex)
        
        zIndex += 1;
        playerIndex += 1;

        if (playerIndex == players.length){
            cardIndex += 1;
            playerIndex = 0;
        }

        i += 1;
    }, timing);
}


////////////////////////////////////// CARD EVENTS ///////////////////////////////////////////////

function mouseOverEvent(elem){

    elem.addEventListener(
        "mouseenter",
        (event) => {
            // Hover UP //
            const cardID = findCardID(elem);
            if (cardsDB.data[cardID].access && players[0].data.active && !cardsDB.data[cardID].picked){
                event.target.style = cardHoverEffect(event.target, cardID,'up');
            }
        },
        false,
      );

      elem.addEventListener(
        "mouseleave",
        (event) => {
            // Hover DOWN //
            const cardID = findCardID(elem);
            if (cardsDB.data[cardID].access && players[0].data.active && !cardsDB.data[cardID].picked){
                event.target.style = cardHoverEffect(event.target, cardID,'reverse');
            }
        },
        false,
      );
}


function cardClickEvent(elem){
    elem.addEventListener('click', (event)=>{
        const cardID = findCardID(event.target.parentElement.parentElement);
        if (cardsDB.data[cardID].access && players[0].data.active){
            pickCardEffect(cardID)
        }
    })
}


///////////////////////////////////////// CARD EFFECTS ///////////////////////////////////////////////////

function pickCardEffect(cardID){
    // console.log('pickCardEffect', cardID)
    // If picked card in local player's hand unpick all cards //
    if(players[0].data.cards.includes(cardID)){
        // console.log('Local Player Card Picked')
        players[0].data.cards.forEach(id => {
            cardsDB.data[id].picked = false
            cardsDB.data[id].elem.style = cardHoverEffect(cardsDB.data[id].elem, id,'reverse');
        })
    }

    // If picked card in bank's hand unpick all cards //
    if(players[4].data.cards.includes(cardID)){
        // console.log('Bank Card Picked')
        players[4].data.cards.forEach(id => {
            cardsDB.data[id].picked = false
            cardsDB.data[id].elem.style = cardHoverEffect(cardsDB.data[id].elem, id,'reverse');
        })
    }

    cardsDB.data[cardID].elem.style = cardHoverEffect(cardsDB.data[cardID].elem, cardID,'up');
    cardsDB.data[cardID].picked = true;

}


function cardHoverEffect(hoverElem, cardID ,effect){
    let matrixStr = ''
    let targetStyle = hoverElem.getAttribute('style').split(/\s/);
    targetStyle = targetStyle.map(item => item.replace(',',''));
    const transform = targetStyle[0];
    const matrix3D = targetStyle.slice(1, targetStyle.length-6);
    const trailing = targetStyle.slice(targetStyle.length -6);

    let hoverX = 5
    let hoverY = 40

    if (effect === 'up'){
        if(!cardsDB.data[cardID].hover && !cardsDB.data[cardID].picked){
            matrix3D[12] = Number(matrix3D[12]) - hoverX;
            matrix3D[13] = Number(matrix3D[13]) - hoverY;
            cardsDB.data[cardID].hover = true;
        }
    }

    if (effect === 'reverse'){
        if(cardsDB.data[cardID].hover && !cardsDB.data[cardID].picked){
            matrix3D[12] = Number(matrix3D[12]) + hoverX;
            matrix3D[13] = Number(matrix3D[13]) + hoverY;
            cardsDB.data[cardID].hover = false;
        }
    }

    matrixStr = `${transform} ${matrix3D.toString()} ${trailing.toString().replace(/,/g, ' ')}}`;
    return matrixStr;
}



/////////////////////////////////// HELPER FUNCTION ///////////////////////////////////////////////

function findCardID(cardElem){
    const returnID = Object.keys(cardsDB.data).filter(cardID => cardsDB.data[cardID].elem == cardElem)[0];   
    return returnID;
}


function createElement(elemType){
    return document.createElement(elemType);
}


function removeElements(elems=[]){
    elems.forEach(elem => {
        if (elem){
            elem.remove()
        }
    })
    
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