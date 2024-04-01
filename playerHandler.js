// import {dataHandler} from 'dataHandler.js';
import {gameData} from './dataHandler.js' 
import * as dataHandler from './dataHandler.js';
import * as game from './gameMechanics.js';
// const gameData = dataHandler.gameData;
//updateGame
//updateHost
//sendGameData

///////////////////////////////////// PLAYERS //////////////////////////////////////////


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


// CAN MOVE TO APP.JS //

export function nextPlayer(){
    if (gameData.singlePlayer){
        game.updateGame();

        gameData.pickedBank = null;
        gameData.pickedHand = null;

        isAutoPlayerNext()
    }
    else {
        if (gameData.players[0].data.connectionId == gameData.hostName){
            game.updateGame()
            dataHandler.sendGameData('host')
        }
        else {
            dataHandler.sendGameData('client');
        }
    }
}


export function isAutoPlayerNext(){
    if (gameData.activePlayerId.slice(0,4) == 'auto'){
        autoPlayer(findPlayerById(gameData.activePlayerId));
    }
}



// ONLY USED INSIDE PLAYERS //
// HOST FUNCTION //
function autoPlayer(active){
    setTimeout(()=> {
        gameData.pickedBank = gameData.players[4].data.cards[0];
        gameData.pickedHand = active.player.data.cards[0];
        dataHandler.updateHost(gameData);
    }, 2000);
    
}


// HOST FUNCTION //
export function setNextPlayerActive(){
    if (gameData.players[0].data.connectionId == gameData.hostName){
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