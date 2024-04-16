import { autoPlayerPick } from './autoPlayer.js';
import { gameData } from './dataHandler.js' 
import * as dataHandler from './dataHandler.js';
import * as dom from './dom.js';


export function returnPlayerList(){
    return gameData.players.map(player => player.name)
}


export function shuffleHostPlayers(gameDataPlayers){
    const clientAtIndex = gameDataPlayers.findIndex(player =>  player.data.connectionId === gameData.players[0].data.connectionId);
    const clientFirst = gameDataPlayers.slice(clientAtIndex, 4)
    const theRest = gameDataPlayers.slice(0, clientAtIndex)
    const bank = gameDataPlayers[4]
    const shuffledPlayers = [...clientFirst,...theRest, bank];

    const locations = ['south', 'west', 'north', 'east', 'center'];
    shuffledPlayers.forEach((player, index) => player.location = locations[index]);

    return shuffledPlayers
}


export function findPlayerById(connectionId){
    const result = {index: '', player: ''}
    gameData.players.forEach((player, index) => {
        if (player.data.connectionId === connectionId){
            result.index = index;
            result.player = player
        }
    })
    return result
}


export function nextPlayer(){
    if (gameData.singlePlayer){
        if (!gameData.endOfGame){
            dataHandler.updateGame();
            dom.updateDomGame();
            gameData.pickedBank = [];
            gameData.pickedHand = [];
        }
        else {
            dom.flipAllCards()
        }
    }
    else {
        if (gameData.players[0].data.connectionId == gameData.hostName){
            dataHandler.updateGame();
            dom.updateDomGame();
            const sender = 'host';
            dataHandler.sendGameData(sender);
        }
        else {
            const sender = 'client';
            dataHandler.sendGameData(sender);
        }
    }
}


export function isAutoPlayerNext(){
    if (gameData.activePlayerId.slice(0,4) == 'auto' && ! gameData.endOfGame){
        autoPlayer(findPlayerById(gameData.activePlayerId));
    }
}


// HOST FUNCTION //
function autoPlayer(active){
    setTimeout(()=> {
        const mappedHand = active.player.data.cards.map(card => gameData.cards[card]);
        const mappedBank = gameData.players[4].data.cards.map(card => gameData.cards[card]);
        const pickedCards = autoPlayerPick(mappedHand, mappedBank);

        gameData.pickedHand = pickedCards.hand;
        gameData.pickedBank = pickedCards.bank;

        if (infiniteLoop(active, pickedCards.bank)){
            gameData.pickedHand = [];
            gameData.pickedBank = [];
        }
        dataHandler.updateHost(gameData);  
        
    }, 2000);
    
}


function infiniteLoop(active, pickedBankCard){
    let fail = false
    pickedBankCard.forEach(card => {
        active.player.data.history.push(card);
        const recursions = active.player.data.history.filter(item => item == card);
        if (recursions.length >= 3){
            fail = true
        }
    })

    return fail
}


export function setPlayerPass(){
    gameData.players[0].data.pass = true;
    gameData.pickedHand = [];
    gameData.pickedBank = [];
}


// HOST FUNCTION //
export function setNextPlayerActive(){
    if (gameData.players[0].data.connectionId == gameData.hostName && !gameData.endOfGame){
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

        if (playerPass(gameData.players[index])){
            setNextPlayerActive();
        }
        else {
            if(dataHandler.isLastTurn()){
                gameData.lastTurn = gameData.players[index].name
            }
        }
    }
    
    if (gameData.endOfGame) {
        gameData.players.forEach(player => player.data.pass = true);
    }
}


function playerPass(active){
    if (!gameData.endOfGame){
        if (active.data.pass){
            return true
        }
        else {
            return false
        }
    }
}