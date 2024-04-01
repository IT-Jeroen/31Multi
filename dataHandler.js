// 'players.js'
import {players} from 'players.js';
// 'p2p.js'
import {p2p} from 'p2p.js';
// 'gameMechanics.js'
import {game} from 'gameMechanics.js'

// const hostName = '31-multi-host-test-id';

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
    hostName: '31-multi-host-test-id',
    isHost: null,
    singlePlayer: true,
    players: players,
    cards: null,
    pickedHand: null,
    pickedBank: null,
    activePlayerId: null,
    prevActivePlayerId: null,
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


// 'updateGame' 'gameMechanics.js'
// 'isAutoPlayerNext' ' players.js'
// HOST FUNCTION //
// on 'data type == 'host-data //
function updateHost(clientData){

    gameData.pickedBank = clientData.pickedBank;
    gameData.pickedHand = clientData.pickedHand;
    
    game.updateGame();

    sendGameData('host');
    gameData.pickedBank = null;
    gameData.pickedHand = null;

    players.isAutoPlayerNext();
}


// 'updateGame' 'gameMechanics'
// CLIENT FUNCTION //
// on 'data' type == client-data //
function updateClient(receivedGameData){
    const isClient = true;
    updateGameData(receivedGameData)
    game.updateGame(isClient);

    gameData.pickedHand = null;
    gameData.pickedBank = null;
}


// 'shuffleHostPlayers' 'players.js'
function updateGameData(receivedGameData){
    const shuffledPlayers = players.shuffleHostPlayers(receivedGameData.players);
    const newGameData = {...receivedGameData};
    newGameData.players = shuffledPlayers;

    Object.keys(gameData).forEach(key => {
        gameData[key] = newGameData[key];
    })
}

// CAN MOVE TO P2P.JS ??? //
// 'pushData' 'p2p.js'
function sendGameData(id){
    if (id == 'host'){
        connections.forEach(connection => {
            p2p.pushData(connection.c, gameData, 'client-data')
        })
    }
    if (id == 'client') {
        const clientData = {pickedBank: gameData.pickedBank, pickedHand: gameData.pickedHand}
        p2p.pushData(connections[0].c, clientData, 'host-data')
    }
}


// 'findPlayerById' 'players.js'
function swapPlayerCards(){
    const bank = players.findPlayerById('bank').player;
    const player = players.findPlayerById(gameData.activePlayerId).player;

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