const hostName = '31-multi-host-id';
// const cardsDB = {width: 169, height: 244, data: null}; // width and height could differ per player
// cardsDB.data[card] = {value: cardValue, suit: splitID[0], icon: splitID[1]};

const players = [
    {'name':'Local', 'location': 'south', 'p2p':{'p': null, 'c': null}, 'data':{ 'id': 'local', 'cards':[], 'last-dropped-cards': [],'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':false}},
    {'name':'Auto 1', 'location': 'west', 'p2p':{'p': null, 'c': null}, 'data':{ 'id': 'auto-1', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
    {'name':'Auto 2', 'location': 'north', 'p2p':{'p': null, 'c': null}, 'data':{ 'id': 'auto-2', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
    {'name':'Auto 3', 'location': 'east', 'p2p':{'p': null, 'c': null},'data':{ 'id': 'auto-3', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
    {'name':'Bank', 'location': 'center', 'p2p':{'p': null, 'c': null}, 'data':{ 'id': 'bank', 'cards':[], 'last-dropped-cards': [], 'wins': 0, 'loses': 0, 'pass': true, 'active':false, 'auto':false}}
]

const gameData = {
    players: players,
    cards: null,
    pickedHand: null,
    pickedBank: null,
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
    dealCards(prepCards())
    startGame()
}


function startGame(){
    renderApp(createPlayfield())
    handOutDeckCards(300)
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
            gameData.players[0].p2p.p = result.p;
            gameData.players[0].p2p.c = result.c;
            gameData.players[0].data.id = result.c.connectionId;

            setConnectionEvents(result.c)
            renderApp(createWaitingRoom())
        }
        else{
            result.p.destroy();
            gameData.players[0].p2p.c = null;
            gameData.players[0].p2p.p = null;
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

        addNewConnection(c)

        // Trigger waiting room at Client //
        gameData.players.forEach(clientPlayer => {
            pushData(clientPlayer.p2p.c, playersData(), 'waiting-room')
        })

        // Update Waiting Room //
        renderApp(createWaitingRoom())
    })

    peer.on('error', err => {console.log('PEER ERROR:', err)});

    // Create Waiting Room //
    gameData.players[0].name = playerName;
    gameData.players[0].p2p.p = peer;
    gameData.players[0].data.id = hostName;
    renderApp(createWaitingRoom())

}



function addNewConnection(c){
    const excistingPlayer = gameData.players.some(playerHost => {
        if (playerHost.p2p.c){
            
            if (playerHost.p2p.c.connectionId === c.connectionId){
                return true
            }
        }
        
    })

    if(!excistingPlayer){
        const autoPlayerIndex = gameData.players.findIndex(playerHost => playerHost.data.auto)
        
        if (autoPlayerIndex == -1){
            console.log('CANNOT ADD CONNECTION:', c.metadata)
            // c.send('CANNOT ADD CLIENT')
        }
        else{
            gameData.players[autoPlayerIndex].name = c.metadata;
            gameData.players[autoPlayerIndex].p2p.c = c;
            gameData.players[autoPlayerIndex].data.auto = false;
            gameData.players[autoPlayerIndex].data.id = c.connectionId;
        }
        
    }
    else {
        console.log('NOT A NEW CONNECTION:', c.metadata)
    }
}


// Client Side (Only one connection) //
function setConnectionEvents(c) {

    c.on('data', function (data) {
        if (data.type === 'waiting-room'){
            updatePlayerList(data.data)
            renderApp(createWaitingRoom())
        }

        if (data.type == 'players-data'){
            updatePlayerData(data.data)
        }

        if (data.type == 'card-data'){
            setCardsDB(data.data)
        }

        if (data.type == 'start-game'){
            updatePlayerData(data.data)
            startGame()
            // temp hardcoded activation //
            gameData.players[0].data.active=true
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
    if (gameData.players[0].p2p.p._id === hostName){
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
    return returnPlayerList().map(player => createPlayerLabel(player))
}


function createPlayerLabel(player) {
    const playerDiv = document.createElement('div');
    const playerHeading = document.createElement('h2');
    playerHeading.innerText = player;
    playerDiv.appendChild(playerHeading);
    return playerDiv;
}


function updatePlayerList(playersHost){
    const shuffledHost = shuffleHostArray(playersHost)
    gameData.players.forEach((player, index) => {
        player.name = shuffledHost[index].name;
        player.data = shuffledHost[index].data;
    })
}


///////////////////////////////////// PLAYERS //////////////////////////////////////////

function returnPlayerList(){
    return gameData.players.map(player => player.name)
}


function playersData(){
    return gameData.players.map(player => {
        return {"name": player.name, "data": player.data}
    })    
}


function shuffleHostArray(playersHost){
    const clientAtIndex = playersHost.findIndex(playerHost =>  playerHost.data.id === gameData.players[0].data.id);

    const clientFirst = playersHost.slice(clientAtIndex, 4)
    const theRest = playersHost.slice(0, clientAtIndex)
    const bank = playersHost[4]
    const shuffledHost = [...clientFirst,...theRest, bank]

    return shuffledHost
}



function findPlayerById(playersArr,id){
    return playersArr.find(player => player.data.id == id)
}


function updatePlayerData(playersHost){
    gameData.players.forEach(player => {
        const hostPlayer = findPlayerById(playersHost,player.data.id);
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

        gameData.players.forEach(player => {
            pushData(player.p2p.c, gameData.cards, 'card-data');
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

    gameData.players.forEach(player => {
        pushData(player.p2p.c, playersData(), 'start-game');
        // temp hardcoded activation //
        gameData.players[0].data.active=true
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
        // cardsDB.data[card] = {elem: null, picked: false, hover: false, access: false, value: cardValue, suit: splitID[0], icon: splitID[1], location: 'center', x: 0, y: 0};
        // cardsDB.data[card] = {elem: null, value: cardValue, suit: splitID[0], icon: splitID[1], location: 'deck'};
        gameData.cards[card] = {value: cardValue, suit: splitID[0], icon: splitID[1]};
    })
}


//////////////////////////// 31 Single //////////////////////////////////////


function createElem(elemType, classNames=[], idName){
    const elem = document.createElement(elemType);

    for (let className of classNames){
        elem.classList.add(className)
    }
    
    elem.id = idName

    return elem;
}


// // Local Function //
// function createDeck(component){;
//     const cardIDs = Object.keys(cardsDB.data) 
//     cardIDs.forEach((cardID, index) => {

//         cardsDB.data[cardID].elem = createCardElem(cardID);
//         cardsDB.data[cardID].location = 'deck';

//         cardsDB.data[cardID].elem.addEventListener('click',e => {
//             cardClickEvent(e)
//         })

//         cardsDB.data[cardID].elem.classList.add('deck');
//         component.appendChild(cardsDB.data[cardID].elem)

//     })
// }


// function cardClickEvent(e){
//     const classes = e.currentTarget.classList;
//     const south = classes.contains('south');
//     const center = classes.contains('center');

//     if (south){
//         const cards = [...document.getElementsByClassName('south')];
//         cards.forEach(card => {
//             card.classList.remove('clicked');
//         })
//         e.currentTarget.classList.add('clicked');
//     }

//     if (center){
//         const cards = [...document.getElementsByClassName('center')];
//         cards.forEach(card => {
//             card.classList.remove('clicked');
//         })
//         e.currentTarget.classList.add('clicked');
//     }
// }



// const gameData = {
//     players: players,
//     cards: null,
//     pickedHand: null,
//     pickedBank: null,
// }



function cardClickEvent(e){
    const classes = e.currentTarget.classList;
    const south = classes.contains('south');
    const center = classes.contains('center');

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
}


function swapCard(){
    if (gameData.pickedHand && gameData.pickedBank){
        const cardHand = document.getElementById(gameData.pickedHand);
        cardHand.classList.remove('clicked');
        const handCss = cardHand.className;

        const cardBank = document.getElementById(gameData.pickedBank);
        cardBank.classList.remove('clicked');
        const bankCss = cardBank.className

        cardHand.className = bankCss;
        cardBank.className = handCss;

        gameData.pickedHand = null;
        gameData.pickedBank = null;
        
    }
    else {
        console.log('Please Select Two Cards!');
    }

}

// function swapCard(){
//     const clicked = [...document.getElementsByClassName('clicked')]

//     if (clicked.length == 2){
//         const _a = clicked[0].className;
//         const _b = clicked[1].className;
    
//         clicked[0].className = _b;
//         clicked[1].className = _a;

//         clicked[0].classList.remove('clicked');
//         clicked[1].classList.remove('clicked');
//     }
//     else {
//         console.log('Please Select Two Cards!');
//     }

// }
 

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


// // Actuall Trigger for the Deck CSS Animation //
// // Classes card deck
// function handOutDeckCards(timing=0){
//     let i = 0;
//     let playerIndex = 0;
//     let cardIndex = 0;
//     let numCardsToDeal = 0;
    
//     players.forEach(player => {
//         numCardsToDeal += player.data.cards.length;
//     })

//     const intervalID = setInterval(()=>{
//         if (i == numCardsToDeal -1){
//             clearInterval(intervalID);
//         }
        
//         let player = players[playerIndex];
//         const cardID = player.data.cards[cardIndex];
//         const card = cardsDB.data[cardID]

//         card.elem.className = `card ${player.location}`
//         playerIndex += 1;

//         if (playerIndex == players.length){
//             cardIndex += 1;
//             playerIndex = 0;
//         }

//         i += 1;
//     }, timing);
// }


// Local Function //
function createDeck(component){;
    const cardIDs = Object.keys(gameData.cards) 
    cardIDs.forEach(cardID => {

        const cardElem = createCardElem(cardID);
        cardElem.id = cardID
        cardElem.classList.add('deck')
        // cardsDB.data[cardID].location = 'deck';

        cardElem.addEventListener('click',e => {
            cardClickEvent(e)
        })

        
        component.appendChild(cardElem)

    })
}


// Actuall Trigger for the Deck CSS Animation //
// Classes card deck
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