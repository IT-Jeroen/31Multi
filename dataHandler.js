import * as playerHandler from './playerHandler.js';
import * as p2p from './p2p.js';
import * as game from './gameMechanics.js';
import * as dom from './dom.js';

export const connections = [
    {'name':'Local', 'connectionId': null, 'p': null, 'c': null},
    {'name':'Auto 1', 'connectionId': null, 'p': null, 'c': null},
    {'name':'Auto 2', 'connectionId': null, 'p': null, 'c': null},
    {'name':'Auto 3', 'connectionId': null, 'p': null, 'c': null},
    {'name':'Bank', 'connectionId': null, 'p': null, 'c': null},
]

const players = [
    {'name':'Local', 'location': 'south', 'data':{ 'connectionId': 'local', 'cards':[], 'history': [],'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':false}},
    {'name':'Auto 1', 'location': 'west', 'data':{ 'connectionId': 'auto-1', 'cards':[], 'history': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
    {'name':'Auto 2', 'location': 'north', 'data':{ 'connectionId': 'auto-2', 'cards':[], 'history': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
    {'name':'Auto 3', 'location': 'east', 'data':{ 'connectionId': 'auto-3', 'cards':[], 'history': [], 'wins': 0, 'loses': 0, 'pass': false, 'active':false, 'auto':true}},
    {'name':'Bank', 'location': 'center', 'data':{ 'connectionId': 'bank', 'cards':[], 'history': [], 'wins': 0, 'loses': 0, 'pass': true, 'active':false, 'auto':false}}
]


export const gameData = {
    hostName: '31-multi-host-test-id',
    isHost: null,
    singlePlayer: true,
    players: players,
    cards: null,
    pickedHand: [],
    pickedBank: [],
    activePlayerId: null,
    prevActivePlayerId: null,
    endOfGame: false,
}


export function setCardsDB(data){
    if (!gameData.cards){
        gameData.cards = data
    } else{
        console.log('UPDATE CARDSDB WHAT HAPPEND ???')
    }
}


function returnCardValue(icon){
    const charValues = {'ace':11, 'king':10, 'queen':10, 'jack': 10};
    let cardValue = Number(icon);
    
    if (!cardValue){
        cardValue = charValues[icon];
    }

    return cardValue
}


export function addCardsToCardDB(cards){
    gameData.cards = {};
    cards.forEach(card => {
        const splitID = card.split('_')
        const cardValue = returnCardValue(splitID[1]);
        gameData.cards[card] = {value: cardValue, suit: splitID[0], icon: splitID[1]};
    })
}


export function initializeGame(){
    gameData.activePlayerId = gameData.players[0].data.connectionId;
    gameData.players[0].data.active = true;
    game.dealCards(game.prepCards())
    
    connections.forEach(connection => {
        p2p.pushData(connection.c, gameData, 'start-game');
    })
    
    dom.startGame()
}


// HOST FUNCTION (Auto Player)//
// on 'data type == 'host-data //
export function updateHost(clientData){

    gameData.pickedBank = clientData.pickedBank;
    gameData.pickedHand = clientData.pickedHand;

    if (gameData.pickedBank.length == 0 || gameData.pickedBank.length == 3){
        // Player Pass //
        const active = playerHandler.findPlayerById(gameData.activePlayerId);
        active.player.data.pass = true; 
        console.log('PLAYER PASS', active.player.name)
    }
    
    game.updateGame();

    const sender = 'host';
    sendGameData(sender);
    // gameData.pickedBank = null;
    // gameData.pickedHand = null;
    gameData.pickedBank = [];
    gameData.pickedHand = [];

    // if next player == auto, this will trigger the autoPlayer //
    // else client or host will trigger nextplayer responds //
    if (!gameData.endOfGame){
        playerHandler.isAutoPlayerNext();
    }
    else {
        console.log('updateHost END OF GAME');
        dom.flipAllCards();
    }
    
}


// CLIENT FUNCTION //
// on 'data' type == client-data //
export function updateClient(receivedGameData){
    const isClient = true;
    updateGameData(receivedGameData)
    game.updateGame(isClient);

    // gameData.pickedHand = null;
    // gameData.pickedBank = null;
    gameData.pickedHand = [];
    gameData.pickedBank = [];
}


export function updateGameData(receivedGameData){
    const shuffledPlayers = playerHandler.shuffleHostPlayers(receivedGameData.players);
    const newGameData = {...receivedGameData};
    newGameData.players = shuffledPlayers;

    Object.keys(gameData).forEach(key => {
        gameData[key] = newGameData[key];
    })
}


export function sendGameData(id){
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


// export function swapPlayerCards(){
//     const bank = playerHandler.findPlayerById('bank').player;
//     const player = playerHandler.findPlayerById(gameData.activePlayerId).player;

//     // const bankArray = bank.data.cards.filter(card => card != gameData.pickedBank);
//     // const playerArray = player.data.cards.filter(card => card != gameData.pickedHand);
//     const bankArray = bank.data.cards.filter(card => card != gameData.pickedBank[0]);
//     const playerArray = player.data.cards.filter(card => card != gameData.pickedHand[0]);
    
//     if (bankArray.length == 2 && playerArray.length == 2){
//         // bankArray.push(gameData.pickedHand);
//         // playerArray.push(gameData.pickedBank);
//         bankArray.push(gameData.pickedHand[0]);
//         playerArray.push(gameData.pickedBank[0]);
        
//         bank.data.cards = bankArray;
//         player.data.cards = playerArray;
//     }
//     else {
//         // Should only happen when a player pass, pickedHand and pickBank are null //
//         console.log(`Unexpected Length Card Arrays; Bank: ${bankArray.length}, Player: ${playerArray.length}`);
//         console.log(`Picked Cards; Bank: ${gameData.pickedBank}, Player: ${gameData.pickedHand}`);
//     }
    
// }


export function swapPlayerCards(){
    const bank = playerHandler.findPlayerById('bank').player;
    const player = playerHandler.findPlayerById(gameData.activePlayerId).player;

    if (gameData.pickedBank.length == gameData.pickedHand.length){
        gameData.pickedBank.forEach((pickedCard,index) => {
            const bankArray = bank.data.cards.filter(card => card != pickedCard);
            const playerArray = player.data.cards.filter(card => card != gameData.pickedHand[index]);

            if (bankArray.length == 2 && playerArray.length == 2){
                bankArray.push(gameData.pickedHand[index]);
                playerArray.push(pickedCard);
                
                bank.data.cards = bankArray;
                player.data.cards = playerArray;
            }
            else {
                console.log(`Unexpected Length Card Arrays; Bank: ${bankArray.length}, Player: ${playerArray.length}`);
                console.log(`Picked Cards; Bank: ${gameData.pickedBank}, Player: ${gameData.pickedHand}`);
            }
        })
    }
}


// // isn't called anywhere //
// export function swapBankCards(){
//     const bank = playerHandler.findPlayerById('bank').player;
//     const bankCards = [...bank.data.cards];
//     const player = playerHandler.findPlayerById(gameData.activePlayerId).player;
//     const playerCards = [...player.data.cards];

//     if(bankCards.length == 3 && playerCards.length == 3){
//         bank.data.cards = playerCards;
//         player.data.cards = bankCards;
//         // set player pass to true
//     }
//     else {
//         console.log(`Unexpected Length Card Arrays; Bank: ${bankArray.length}, Player: ${playerArray.length}`);
//     }

// }