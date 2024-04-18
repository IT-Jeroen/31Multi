import * as playerHandler from './playerHandler.js';
import * as p2p from './p2p.js';
import * as game from './gameMechanics.js';
import * as dom from './dom.js';
import {calculateHand} from './autoPlayer.js';

export const connections = [
    {'name':'Local', 'connectionId': null, 'p': null, 'c': null},
    {'name':'Auto 1', 'connectionId': null, 'p': null, 'c': null},
    {'name':'Auto 2', 'connectionId': null, 'p': null, 'c': null},
    {'name':'Auto 3', 'connectionId': null, 'p': null, 'c': null},
    {'name':'Bank', 'connectionId': null, 'p': null, 'c': null},
]

const players = [
    {'name':'Local', 'location': 'south', 'data':{ 'connectionId': 'local', 'cards':[], 'history': [],'wins': 0, 'pass': false, 'active':false, 'auto':false}},
    {'name':'Auto 1', 'location': 'west', 'data':{ 'connectionId': 'auto-1', 'cards':[], 'history': [], 'wins': 0, 'pass': false, 'active':false, 'auto':true}},
    {'name':'Auto 2', 'location': 'north', 'data':{ 'connectionId': 'auto-2', 'cards':[], 'history': [], 'wins': 0, 'pass': false, 'active':false, 'auto':true}},
    {'name':'Auto 3', 'location': 'east', 'data':{ 'connectionId': 'auto-3', 'cards':[], 'history': [], 'wins': 0, 'pass': false, 'active':false, 'auto':true}},
    {'name':'Bank', 'location': 'center', 'data':{ 'connectionId': 'bank', 'cards':[], 'history': [], 'wins': 0, 'pass': true, 'active':false, 'auto':false}}
]

// // only (host and) client players ??? //
// export let waitingRoom = [];

// export function returnWaitingRoomList(){
//     return waitingRoom
// }


export const gameData = {
    hostName: '31-multi-host-test-id',
    isHost: null,
    singlePlayer: true,
    players: JSON.parse(JSON.stringify(players)),
    cards: null,
    pickedHand: [],
    pickedBank: [],
    activePlayerId: null,
    prevActivePlayerId: null,
    endOfGame: false,
    lastTurn: null,
    waitingRoom: [],
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

function isSinglePlayer(){
    if (gameData.players[1].data.auto && gameData.players[2].data.auto && gameData.players[2].data.auto){
        return true;
    }
    else {
        return false;
    }
}

export function initializeGame(){
    gameData.singlePlayer = isSinglePlayer();
    const randomInt = Math.floor(Math.random() * 4);
    gameData.activePlayerId = gameData.players[randomInt].data.connectionId;
    gameData.players[randomInt].data.active = true;
    game.dealCards(game.prepCards())
    
    connections.forEach(connection => {
        p2p.pushData(connection.c, gameData, 'start-game');
    })
    
    dom.startGame()
    gameData.waitingRoom = [];
}


// HOST FUNCTION (Auto Player)//
// on 'data type == 'host-data //
export function updateHost(clientData){

    gameData.pickedBank = clientData.pickedBank;
    gameData.pickedHand = clientData.pickedHand;

    if (gameData.pickedBank.length == 0 || gameData.pickedBank.length == 3){
        const active = playerHandler.findPlayerById(gameData.activePlayerId);
        active.player.data.pass = true; 
    }

    updateGame();
    dom.updateDomGame();

    const sender = 'host';
    sendGameData(sender);

    gameData.pickedBank = [];
    gameData.pickedHand = [];
    
}


// CLIENT FUNCTION //
// on 'data' type == client-data //
export function updateClient(receivedGameData){
        const isClient = true;
        updateGameData(receivedGameData);
        dom.updateDomGame();

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


// HOST FUNCTION //
export function updateGame(){
    
    if (!gameData.endOfGame){
        swapPlayerCards();
        const active = playerHandler.findPlayerById(gameData.activePlayerId);
        if (isLastTurn()){
            active.player.data.pass = true;
        }

        endOfGameCheck();
        playerHandler.setNextPlayerActive();
        playerHandler.isAutoPlayerNext();
    }
}


export function endOfGameCheck(){
    const active = playerHandler.findPlayerById(gameData.activePlayerId);
    const allPlayersPass = gameData.players.every(player => player.data.pass);
    if(allPlayersPass){
        gameData.endOfGame = true;
    }

    
    const mappedHand = active.player.data.cards.map(card => gameData.cards[card]);
    const score = calculateHand(mappedHand);
    
    
    if (score == 31){
        // console.log(`Player ${active.player.name} Scores 31`)
        // active.player.data.pass = true;
        // active.player.data.wins += 1;
        gameData.endOfGame = true
        gameData.players.forEach(player => player.data.pass = true);
    }   
}


export function isLastTurn(){
    const nonPassPlayers = gameData.players.filter(player => !player.data.pass);

    if (nonPassPlayers.length == 1){
        if (nonPassPlayers[0].data.connectionId == gameData.activePlayerId){
            return true
        }
    }
}


export function scoring(){
    let roundWinners = [];
    let topScore = 0;
    let gameWinners = [];
    let wins = 0;

    gameData.players.forEach(player => {
        const mappedHand = player.data.cards.map(card => gameData.cards[card]);
        const score = calculateHand(mappedHand);
        
        if (score == topScore){
            // roundWinners.push(player.name);
            roundWinners.push(player);
        }
        if (score > topScore){
            topScore = score;
            // roundWinners = [player.name];
            roundWinners = [player];
        }

        if (player.data.wins == wins){
            // gameWinners.push(player.name);
            gameWinners.push(player);
        }
        if (player.data.wins > wins){
            // gameWinners = [player.name];
            wins = player.data.wins;
            gameWinners = [player];
        }

    })

    roundWinners.forEach(player => player.data.wins += 1);

    return {score: topScore, roundWinners: roundWinners, wins: wins, gameWinners: gameWinners}
}

// LOCAL FUNCTION //
export function leaveGame(player){
    if (player.data.connectionId != gameData.hostName){
        p2p.pushData(connections[0].c, player, 'leave-game');
    }
    else {
        connections.forEach(connection => {
            p2p.pushData(connection.c, null, 'host-leaving');
        })
    }
    
}

// LOCAL FUNCTION //
export function nextGame(){
    
    if (gameData.players[0].data.connectionId == gameData.hostName){
        // gameData.hostName = '';
        // gameData.isHost = null;
        // gameData.singlePlayer = true; moved to initializeGame();
        gameData.cards = null;
        gameData.pickedBank = [];
        gameData.pickedHand = [];
        gameData.activePlayerId = null;
        gameData.prevActivePlayerId = null;
        gameData.endOfGame = false;
        gameData.lastTurn = null;

        gameData.players.forEach(player => {
            player.data.cards = [];
            player.data.history = [];
            player.data.active = false;
            player.data.pass = false;
            if (player.data.connectionId == 'bank'){
                player.data.pass = true;
            }
        })

        gameData.waitingRoom.push(gameData.players[0])
        // dom.renderApp(dom.createWaitingRoom());
        updateWaitingRoom();
        
    }
    else {
        // gameData is not reset yet but will be reset once host enters next game //
        p2p.pushData(connections[0].c, gameData.players[0], 'next-game');
    }
    
}


export function updateWaitingRoom(){
    gameData.waitingRoom.forEach(player => {
                
        if (player.data.connectionId == gameData.hostName){
            dom.renderApp(dom.createWaitingRoom())
        }
        else {
            const connect = connections.filter(connection => connection.connectionId == player.data.connectionId)[0];
            p2p.pushData(connect.c, gameData, 'waiting-room');
        }
        

    })
}


export function removeConnection(connectionId){
    connections.forEach((connection, index) => {
    if (connection.connectionId == connectionId){
        connections[index] = {'name':`Auto ${index}`, 'connectionId': null, 'p': null, 'c': null}
        }
   });
}

export function removePlayer(connectionId){
    gameData.players.forEach((player, index) => {
     if (player.data.connectionId == connectionId){
         gameData.players[index] = players[index];
         }
    });
 }