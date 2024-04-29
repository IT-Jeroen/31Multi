import {gameData, connections, addCardsToCardDB} from './dataHandler.js';;
import {pushData} from './p2p.js';


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


// HOST FUNCTION //
export function prepCards(){
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


// HOST FUNCTION //
export function dealCards(cardsInGame){

    gameData.players.forEach((player, index) => {
        player.data.cards = [cardsInGame[index], cardsInGame[index + gameData.players.length], cardsInGame[index + 2 * gameData.players.length]]
    })
}

