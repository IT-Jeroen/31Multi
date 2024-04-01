// 'dom.js'
import {dom} from "dom.js"
// 'p2p.js'
import {p2p} from 'p2p.js'
// 'players.js'
import {players} from 'players.js';
// 'dataHandler.js'
import {dataHandler} from 'dataHandler.js'
const gameData = dataHandler.gameData;

// 'gameData'
// 'pushData' 'p2p.js'
// 'startGame' 'dom.js'
/// Doesn't Apply to Clients, only Host ///
function initializeGame(){
    gameData.activePlayerId = gameData.players[0].data.connectionId;
    gameData.players[0].data.active = true;
    dealCards(prepCards())
    
    connections.forEach(connection => {
        p2p.pushData(connection.c, gameData, 'start-game');
    })
    
    dom.startGame()
}


// // MOVED TO DOM.JS //
// function startGame(){
//     renderApp(createPlayfield());
//     handOutDeckCards(300);
//     updatePlayerLabels();
// }


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

// 'gameData'
// 'addCardsToCardDB' 'gameData.js'
// Host function //
function prepCards(){
    const numPlayerCards = 3
    const maxCards = gameData.players.length * numPlayerCards
    const cardsInGame = createRandomDeckValues(maxCards, '7');

    if (cardsInGame.length / gameData.players.length == numPlayerCards){
        dataHandler.addCardsToCardDB(cardsInGame);

        connections.forEach(connection => {
            p2p.pushData(connection.c, gameData.cards, 'card-data');
        })
        return cardsInGame
    }
    else {
        console.log('CARDS ON TABLE DOES NOT MATCH PLAYERS', cardsInGame.length, gameData.players.length, numPlayerCards);
        return []
    }
}

// 'gameData'
// Host function //
function dealCards(cardsInGame){

    gameData.players.forEach((player, index) => {
        player.data.cards = [cardsInGame[index], cardsInGame[index + gameData.players.length], cardsInGame[index + 2 * gameData.players.length]]
    })
}


// 'swapDomCards' 'dom.js'
// 'swapPlayerCards' 'gameData.js'
// 'setNextPlayerActive' ' players.js'
// 'updatePlayerLabels' 'dom.js'
function updateGame(isClient=false){
    dom.swapDomCards();
    if (!isClient){
        dataHandler.swapPlayerCards();
        players.setNextPlayerActive();
    }
    dom.updatePlayerLabels();
}