import {dataHandler} from 'dataHandler.js';
const gameData = dataHandler.gameData;

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


// CAN MOVE TO APP.JS //

function nextPlayer(){
    if (gameData.singlePlayer){
        dataHandler.updateGame();

        gameData.pickedBank = null;
        gameData.pickedHand = null;

        isAutoPlayerNext()
    }
    else {
        if (gameData.players[0].data.connectionId == gameData.hostName){
            dataHandler.updateGame()
            dataHandler.sendGameData('host')
        }
        else {
            dataHandler.sendGameData('client');
        }
    }
}


function isAutoPlayerNext(){
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
function setNextPlayerActive(){
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