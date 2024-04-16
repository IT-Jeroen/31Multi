const hostName = '31-multi-host-test-id';
// const cardsDB = {width: 169, height: 244, data: null}; // width and height could differ per player
// cardsDB.data[card] = {value: cardValue, suit: splitID[0], icon: splitID[1]};

// Peer-JS binarypack.ts doesn't like this data (TypeError: t is undefined) //
// Peer-JS doesn't like sending the connection and or peer objects //
// const players = [
//     {'name':'Local', 'location': 'south', 'p2p':{'p': null, 'c': null}, 'data':{ 'id': 'local', 'cards':[], 'last-dropped-cards': [],'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':false}},
//     {'name':'Auto 1', 'location': 'west', 'p2p':{'p': null, 'c': null}, 'data':{ 'id': 'auto-1', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
//     {'name':'Auto 2', 'location': 'north', 'p2p':{'p': null, 'c': null}, 'data':{ 'id': 'auto-2', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
//     {'name':'Auto 3', 'location': 'east', 'p2p':{'p': null, 'c': null},'data':{ 'id': 'auto-3', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
//     {'name':'Bank', 'location': 'center', 'p2p':{'p': null, 'c': null}, 'data':{ 'id': 'bank', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': true, 'active':false, 'auto':false}}
// ]

const connections = [
    {'name':'Local', 'connectionId': null, 'p': null, 'c': null},
    {'name':'Auto 1', 'connectionId': null, 'p': null, 'c': null},
    {'name':'Auto 2', 'connectionId': null, 'p': null, 'c': null},
    {'name':'Auto 3', 'connectionId': null, 'p': null, 'c': null},
    {'name':'Bank', 'connectionId': null, 'p': null, 'c': null},
]

const players = [
    {'name':'Local', 'location': 'south', 'data':{ 'connectionId': 'local', 'cards':[], 'last-dropped-cards': [],'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':false}},
    {'name':'Auto 1', 'location': 'west', 'data':{ 'connectionId': 'auto-1', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
    {'name':'Auto 2', 'location': 'north', 'data':{ 'connectionId': 'auto-2', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
    {'name':'Auto 3', 'location': 'east', 'data':{ 'connectionId': 'auto-3', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
    {'name':'Bank', 'location': 'center', 'data':{ 'connectionId': 'bank', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': true, 'active':false, 'auto':false}}
]


const gameData = {
    players: players,
    cards: null,
    pickedHand: null,
    pickedBank: null,
    isHost: null,
    activePlayerId: null,
    prevActivePlayerId: null,
    singlePlayer: true,
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


function handleNameSubmitted(playerName) {
    setupConnection(playerName);
}


function renderApp(component) {
    document.getElementById('table').replaceChildren(component);
}

// Start Page //
renderApp(createNameInput(handleNameSubmitted));


function createPlayfield(){
    const playfield = document.createElement('div')
    playfield.id = 'playfield'
    playfield.classList.add('playfield')

    createDeck(playfield)

    return playfield
}


/// Doesn't Apply to Clients, only Host ///
function initializeGame(){
    gameData.activePlayerId = gameData.players[0].data.connectionId;
    gameData.players[0].data.active = true;
    dealCards(prepCards())
    
    connections.forEach(connection => {
        pushData(connection.c, gameData, 'start-game');
    })
    
    startGame()
}


function startGame(){
    renderApp(createPlayfield());
    handOutDeckCards(300);
    updatePlayerLabels();
}

////////////////////////// CHECK FOR EXISTING HARD CODED HOST ////////////////////////////////

function testHost(playerName){
    return new Promise((resolve, reject) => {
        const peer = new Peer(null, {
            debug: 2
        })

        peer.on('open', function (id) {
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
            gameData.players[0].name = playerName;
            connections[0].name = playerName;
            connections[0].p = result.p;
            connections[0].c = result.c;
            connections[0].connectionId = result.c.connectionId;
            gameData.players[0].data.connectionId = result.c.connectionId;

            setConnectionEvents(result.c)
            renderApp(createWaitingRoom())
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
    const peer = new Peer(hostName, {
        debug: 2
        })

    peer.on('connection', (c)=>{
        gameData.singlePlayer = false;
        addNewConnection(c)
        setConnectionEvents(c)

        connections.forEach(connection => {
            pushData(connection.c, gameData, 'waiting-room');
        })

        // Update Waiting Room //
        renderApp(createWaitingRoom())
    })

    peer.on('error', err => {console.log('PEER ERROR:', err)});

    // Create Waiting Room //
    gameData.players[0].name = playerName;
    connections[0].p = peer;
    gameData.players[0].data.connectionId = peer._id;
    gameData.isHost = playerName;
    renderApp(createWaitingRoom())

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

            connections[autoPlayerIndex].name = c.metadata;
            connections[autoPlayerIndex].connectionId = c.connectionId;
            connections[autoPlayerIndex].c = c;
        }
        
    }
    else {
        console.log('NOT A NEW CONNECTION:', c.metadata)
    }
}


function setConnectionEvents(c) {

    c.on('data', function (received) {
        if (received.type === 'waiting-room'){
            updateGameData(received.data);
            renderApp(createWaitingRoom())
        }


        if (received.type == 'card-data'){
            setCardsDB(received.data)
        }

        if (received.type == 'start-game'){
            updateGameData(received.data);
            startGame()
        }

        if (received.type == 'client-data'){
            updateClient(received.data)
            
        }

        if (received.type == 'host-data'){
            if (gameData.players[0].data.connectionId == hostName){
                updateHost(received.data);

            }
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


function updatePlayerLabels(){
    removePlayerLabels();
    gameData.players.forEach(player => {
        setPlayerLabels(player);
    })
}


function removePlayerLabels(){
    const removeInactive = [...document.getElementsByClassName('player-label')];
    removeInactive.forEach(label => label.remove());
}


function setPlayerLabels(player){
    const playFieldElem = document.getElementById('playfield');

    if(player.name != 'Bank'){

        if(!player.data.active){
            const inActiveLabel = `
            <div class="player-label player-${player.location}">
                ${player.name}
            </div>`
            playFieldElem.insertAdjacentHTML('afterbegin',inActiveLabel);
            
        }

        else {
            if(player.location != 'south'){
                const activeLabel = `
                <div class="player-label player-${player.location} player-active">
                    ${player.name}
                </div>`
                playFieldElem.insertAdjacentHTML('afterbegin',activeLabel);
            }
        }
    }
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

function createWaitingRoom(){
    const waitingRoomDiv = document.createElement('div');
    waitingRoomDiv.id = 'waiting-room';
    waitingRoomDiv.append(...createPlayerList())

    const startBtn = canStartGame()
    if (startBtn){
        waitingRoomDiv.append(startBtn())
    }
    
    return waitingRoomDiv
}


function canStartGame(){
    if (gameData.players[0].data.connectionId === hostName){
        return createStartGameBtn;
    }
    else {
        return null;
    }
}


function createStartGameBtn(){
    const startGameBtn = document.createElement('button');
    startGameBtn.innerText ='Start Game';
    
    startGameBtn.addEventListener('click', () => {
        initializeGame()
    })
    return startGameBtn
}


function createPlayerList() {
    return returnPlayerList().map(player => createPlayerListItem(player))
}


function createPlayerListItem(player) {
    const playerDiv = document.createElement('div');
    const playerHeading = document.createElement('h2');
    playerHeading.innerText = player;
    playerDiv.appendChild(playerHeading);
    return playerDiv;
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
            cardsInDeck.push(`${suit}_${label}`)
        })
    })

    // Randomize cards //
    for (let index = cardsInDeck.length - 1; index > 0; index--){
        
        randomIndex = Math.floor(Math.random() * (index + 1));
        [cardsInDeck[index], cardsInDeck[randomIndex]] = [cardsInDeck[randomIndex], cardsInDeck[index]]
        
      }

    const pickIndex = Math.floor(Math.random() * (cardsInDeck.length - numCards));
    const  cardsInGame = cardsInDeck.slice(pickIndex, pickIndex + numCards);

    return cardsInGame;
}


// Host function //
function prepCards(){
    const numPlayerCards = 3
    const maxCards = gameData.players.length * numPlayerCards
    const cardsInGame = createRandomDeckValues(maxCards, '7');

    if (cardsInGame.length / gameData.players.length == numPlayerCards){
        addCardsToCardDB(cardsInGame);

        connections.forEach(connection => {
            pushData(connection.c, gameData.cards, 'card-data');
        })
        return cardsInGame
    }
    else {
        console.log('CARDS ON TABLE DOES NOT MATCH PLAYERS', cardsInGame.length, gameData.players.length, numPlayerCards);
        return []
    }
}


// Host function //
function dealCards(cardsInGame){

    gameData.players.forEach((player, index) => {
        player.data.cards = [cardsInGame[index], cardsInGame[index + gameData.players.length], cardsInGame[index + 2 * gameData.players.length]]
    })
}


//////////////////////////////////////////// Cards DB ////////////////////////////////////////////////////////


function setCardsDB(data){
    if (!gameData.cards){
        gameData.cards = data
    } else{
        console.log('UPDATE CARDSDB WHAT HAPPEND ???')
    }
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
    gameData.cards = {};
    cards.forEach(card => {
        const cardValue = returnCardValue(card)
        const splitID = card.split('_')
        gameData.cards[card] = {value: cardValue, suit: splitID[0], icon: splitID[1]};
    })
}


//////////////////////////// 31 Single //////////////////////////////////////

function createCardElem(cardID){
    
    const cardElem = document.createElement('div');
    cardElem.classList.add('card')

    const frontElem = document.createElement('div');
    frontElem.classList.add('front')
    const frontImg = document.createElement('img');
    frontImg.src = `./src/img/${cardID}.png`;

    const backElem = document.createElement('div');
    backElem.classList.add('back')
    const backImg = document.createElement('img');
    backImg.src = './src/img/back-blue.png';

    frontElem.appendChild(frontImg);
    backElem.appendChild(backImg);
    cardElem.appendChild(frontElem);
    cardElem.appendChild(backElem);

    return cardElem;
}


// Local Function //
function createDeck(component){;
    const cardIDs = Object.keys(gameData.cards) 
    cardIDs.forEach(cardID => {

        const cardElem = createCardElem(cardID);
        cardElem.id = cardID
        cardElem.classList.add('deck')

        cardElem.addEventListener('click',e => {
            cardClickEvent(e)
        })
   
        component.appendChild(cardElem)

    })
}


// Actuall Trigger for the Deck CSS Animation //
function handOutDeckCards(timing=0){
    let i = 0;
    let playerIndex = 0;
    let cardIndex = 0;
    let numCardsToDeal = 0;
    
    gameData.players.forEach(player => {
        numCardsToDeal += player.data.cards.length;
    })


    const intervalID = setInterval(()=>{
        if (i == numCardsToDeal -1){
            clearInterval(intervalID);
        }
        
        let player = gameData.players[playerIndex];
        const cardID = player.data.cards[cardIndex];
        const card = document.getElementById(cardID)
        card.className = `card ${player.location}`
        playerIndex += 1;

        if (playerIndex == gameData.players.length){
            cardIndex += 1;
            playerIndex = 0;
        }

        i += 1;
    }, timing);
}


function cardClickEvent(e){
    const classes = e.currentTarget.classList;
    const south = classes.contains('south');
    const center = classes.contains('center');

    if (gameData.players[0].data.active){
        if (south){
            if (gameData.pickedHand){
                document.getElementById(gameData.pickedHand).classList.remove('clicked');
            }
            gameData.pickedHand = e.currentTarget.id;
    
            e.currentTarget.classList.add('clicked');
        }
    
        if (center){
            if (gameData.pickedBank){
                document.getElementById(gameData.pickedBank).classList.remove('clicked');
            }
    
            gameData.pickedBank = e.currentTarget.id;
            e.currentTarget.classList.add('clicked');
        }

        if (gameData.pickedBank && gameData.pickedHand){
            createPlayCardsBtn()
        }
    }
}


function createPlayCardsBtn(){
    const btn = `<button id="play-cards">Play Cards</button>`
    document.getElementById('playfield').insertAdjacentHTML('afterbegin', btn);

    document.getElementById('play-cards').addEventListener('click', () => {
        removePlayCardsBtn();
        nextPlayer();
    })
}


function removePlayCardsBtn(){
    document.getElementById('play-cards').remove();
}


///////////////////////////////////// PLAYERS //////////////////////////////////////////

function returnPlayerList(){
    return gameData.players.map(player => player.name)
}


function shuffleHostPlayers(gameDataPlayers){
    const clientAtIndex = gameDataPlayers.findIndex(player =>  player.data.connectionId === gameData.players[0].data.connectionId);
    const clientFirst = gameDataPlayers.slice(clientAtIndex, 4)
    const theRest = gameDataPlayers.slice(0, clientAtIndex)
    const bank = gameDataPlayers[4]
    const shuffledPlayers = [...clientFirst,...theRest, bank];

    const locations = ['south', 'west', 'north', 'east', 'center'];
    shuffledPlayers.forEach((player, index) => player.location = locations[index]);

    return shuffledPlayers
}


function findPlayerById(connectionId){
    const result = {index: '', player: ''}
    gameData.players.forEach((player, index) => {
        if (player.data.connectionId === connectionId){
            result.index = index;
            result.player = player
        }
    })
    return result
}


function nextPlayer(){
    if (gameData.singlePlayer){
        updateGame();

        gameData.pickedBank = null;
        gameData.pickedHand = null;

        isAutoPlayerNext()
    }
    else {
        if (gameData.players[0].data.connectionId == hostName){
            updateGame()
            sendGameData('host')
        }
        else {
            sendGameData('client');
        }
    }
}


function isAutoPlayerNext(){
    if (gameData.activePlayerId.slice(0,4) == 'auto'){
        autoTest(findPlayerById(gameData.activePlayerId));
    }
}

// HOST FUNCTION //
function autoTest(active){
    setTimeout(()=> {
        gameData.pickedBank = gameData.players[4].data.cards[0];
        gameData.pickedHand = active.player.data.cards[0];
        updateHost(gameData);
    }, 2000);
    
}


// HOST FUNCTION //
function setNextPlayerActive(){
    if (gameData.players[0].data.connectionId == hostName){
        // set current active to prevActivePlayerId //
        gameData.prevActivePlayerId = gameData.activePlayerId
        // set current active to false
        const active = findPlayerById(gameData.activePlayerId);
        let index = active.index
        active.player.data.active = false

        index += 1;
        
        if (index >3){
            index = 0;
        }

        gameData.activePlayerId = gameData.players[index].data.connectionId;
        gameData.players[index].data.active = true;

    }
}


// HOST FUNCTION //
// on 'data type == 'host-data //
function updateHost(clientData){

    gameData.pickedBank = clientData.pickedBank;
    gameData.pickedHand = clientData.pickedHand;
    
    updateGame();

    sendGameData('host');
    gameData.pickedBank = null;
    gameData.pickedHand = null;

    isAutoPlayerNext();
}


function updateGameData(receivedGameData){
    const shuffledPlayers = shuffleHostPlayers(receivedGameData.players);
    const newGameData = {...receivedGameData};
    newGameData.players = shuffledPlayers;

    Object.keys(gameData).forEach(key => {
        gameData[key] = newGameData[key];
    })
}


function updateGame(isClient=false){
    swapDomCards();
    if (!isClient){
        swapPlayerCards();
        setNextPlayerActive();
    }
    updatePlayerLabels();
}


function sendGameData(id){
    if (id == 'host'){
        connections.forEach(connection => {
            pushData(connection.c, gameData, 'client-data')
        })
    }
    if (id == 'client') {
        const clientData = {pickedBank: gameData.pickedBank, pickedHand: gameData.pickedHand}
        pushData(connections[0].c, clientData, 'host-data')
    }
}


// CLIENT FUNCTION //
// on 'data' type == client-data //
function updateClient(receivedGameData){
    const isClient = true;
    updateGameData(receivedGameData)
    updateGame(isClient);

    gameData.pickedHand = null;
    gameData.pickedBank = null;
}


function swapPlayerCards(){
    const bank = findPlayerById('bank').player;
    const player = findPlayerById(gameData.activePlayerId).player;

    const bankArray = bank.data.cards.filter(card => card != gameData.pickedBank);
    const playerArray = player.data.cards.filter(card => card != gameData.pickedHand)
    
    if (bankArray.length == 2 && playerArray.length == 2){
        bankArray.push(gameData.pickedHand);
        playerArray.push(gameData.pickedBank);
        
        bank.data.cards = bankArray;
        player.data.cards = playerArray;
    }
    else {
        console.log(`Unexpected Length Card Arrays; Bank: ${bankArray.length}, Player: ${playerArray.length}`);
        console.log(`Picked Cards; Bank: ${gameData.pickedBank}, Player: ${gameData.pickedHand}`);
    }
    
}


function swapDomCards(){
    if (gameData.pickedHand && gameData.pickedBank){
        const cardHand = document.getElementById(gameData.pickedHand);
        cardHand.classList.remove('clicked');
        const handCss = cardHand.className;

        const cardBank = document.getElementById(gameData.pickedBank);
        cardBank.classList.remove('clicked');
        const bankCss = cardBank.className

        cardHand.className = bankCss;
        cardBank.className = handCss;
        
    }
    else {
        console.log('Please Select Two Cards!');
    }
}