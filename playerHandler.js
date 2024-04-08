import { autoPlayerPick } from './autoPlayer.js';
import { gameData } from './dataHandler.js' 
import * as dataHandler from './dataHandler.js';
import * as game from './gameMechanics.js';


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
        // sets pass button only after first round //
        game.updateGame();

        // gameData.pickedBank = null;
        // gameData.pickedHand = null;
        gameData.pickedBank = [];
        gameData.pickedHand = [];

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


// HOST FUNCTION //
function autoPlayer(active){
    setTimeout(()=> {
        const mappedHand = active.player.data.cards.map(card => gameData.cards[card]);
        const mappedBank = gameData.players[4].data.cards.map(card => gameData.cards[card]);
        const pickedCards = autoPlayerPick(mappedHand, mappedBank);
        console.log('PICKED CARDS',pickedCards)
        if(pickedCards == 'player_pass'){
            active.player.data.pass = true;
            // gameData.pickedHand = null;
            // gameData.pickedBank = null;
            gameData.pickedHand = [];
            gameData.pickedBank = [];
        }
        else{
            gameData.pickedHand = [pickedCards.hand];
            gameData.pickedBank = [pickedCards.bank]; 
        }
        dataHandler.updateHost(gameData);  
        
    }, 2000);
    
}

export function playerPass(){
    gameData.players[0].data.pass = true;
    // gameData.pickedHand = null;
    // gameData.pickedBank = null;
    gameData.pickedHand = [];
    gameData.pickedBank = [];
    nextPlayer()
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

        if (!playerPassCheck(gameData.players[index])){
            setNextPlayerActive()
        }

    }
}


// On endGame setNextPlayerActive is waiting on playerPassCheck to continue //
// playerPassCheck endOfGame does not return anything //
function playerPassCheck(active){
    const allPlayerPass = gameData.players.every(player => player.data.pass);
    if (allPlayerPass){
        console.log('END OF GAME');
        // a bit counter intuative, but this is to stop inifinite recursion of nextPlayer() //
        return true
        // endGame()
    }
    else{
        if (active.data.pass){
            return false
        }
        else {
            return true
        }
    }
}