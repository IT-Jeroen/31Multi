// import {gameData} from 'gameData.js'; //
// import {players} from 'players.js';
// import {gameMechanics} from 'gameMechanics.js'; //
// import {p2p} from 'p2p.js';
// import {dom} from 'dom.js';

'dom.js'
'players.js'
'p2p.js'



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


'isAutoPlayerNext' ' players.js'
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


// CLIENT FUNCTION //
// on 'data' type == client-data //
function updateClient(receivedGameData){
    const isClient = true;
    updateGameData(receivedGameData)
    updateGame(isClient);

    gameData.pickedHand = null;
    gameData.pickedBank = null;
}


'shuffleHostPlayers' 'players.js'
function updateGameData(receivedGameData){
    const shuffledPlayers = shuffleHostPlayers(receivedGameData.players);
    const newGameData = {...receivedGameData};
    newGameData.players = shuffledPlayers;

    Object.keys(gameData).forEach(key => {
        gameData[key] = newGameData[key];
    })
}

'pushData' 'p2p.js'
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

'findPlayerById' 'players.js'
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



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

'dom.js'
'p2p.js'
'players.js'


'pushData' 'p2p.js'
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

'ALL dom.js'
function startGame(){
    renderApp(createPlayfield());
    handOutDeckCards(300);
    updatePlayerLabels();
}


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


'swapDomCards' 'dom.js'
'swapPlayerCards' 'players.js'
'setNextPlayerActive' ' players.js'
'updatePlayerLabels' 'dom.js'
function updateGame(isClient=false){
    swapDomCards();
    if (!isClient){
        swapPlayerCards();
        setNextPlayerActive();
    }
    updatePlayerLabels();
}
