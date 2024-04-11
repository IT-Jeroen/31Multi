import { autoPlayerPick } from './autoPlayer.js';
import { gameData } from './dataHandler.js' 
import * as dataHandler from './dataHandler.js';
import * as game from './gameMechanics.js';
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
    const allPlayersPass = gameData.players.every(player => player.data.pass);
    if (!gameData.endOfGame || !allPlayersPass){
        if (gameData.singlePlayer){

            // dom.swapDomCards();
            // if (!isClient){
            //     dataHandler.swapPlayerCards();
            //     playerHandler.setNextPlayerActive();
            // }
            // dom.updatePlayerLabels();
        
            // if (gameData.players[0].data.active){
            //     dom.createPassBtn();
            //     dom.createSwapBankBtn();
            // }

            game.updateGame();
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
    else{
        console.log('nextPlayer END OF GAME');
        // dom.flipAllCards()
    }

}


export function isAutoPlayerNext(){
    if (gameData.activePlayerId.slice(0,4) == 'auto'){
        const allPlayersPass = gameData.players.every(player => player.data.pass);
        if (!gameData.endOfGame || !allPlayersPass){
            autoPlayer(findPlayerById(gameData.activePlayerId));
            // console.log('isAutoPlayerNext GAME DATA', gameData);

        }
        else {
            console.log('isAutoPlayerNext END OF GAME');
            // dom.flipAllCards()
        }
    }
    else {
        console.log('AUTO PLAYER IS NOT NEXT')
    }
}


// // HOST FUNCTION //
// function autoPlayer(active){
//     setTimeout(()=> {
//         const mappedHand = active.player.data.cards.map(card => gameData.cards[card]);
//         const mappedBank = gameData.players[4].data.cards.map(card => gameData.cards[card]);
//         const pickedCards = autoPlayerPick(mappedHand, mappedBank);
//         console.log('AUTO PICKED CARDS',pickedCards)
//         if(pickedCards == 'player_pass'){
//             active.player.data.pass = true;
//             // gameData.pickedHand = null;
//             // gameData.pickedBank = null;
//             gameData.pickedHand = [];
//             gameData.pickedBank = [];
//         }
//         else{
//             gameData.pickedHand = [pickedCards.hand];
//             gameData.pickedBank = [pickedCards.bank]; 
//         }
//         dataHandler.updateHost(gameData);  
        
//     }, 2000);
    
// }



// HOST FUNCTION //
function autoPlayer(active){
    setTimeout(()=> {
        const mappedHand = active.player.data.cards.map(card => gameData.cards[card]);
        const mappedBank = gameData.players[4].data.cards.map(card => gameData.cards[card]);
        const pickedCards = autoPlayerPick(mappedHand, mappedBank);

        gameData.pickedHand = pickedCards.hand;
        gameData.pickedBank = pickedCards.bank;
        // console.log('AUTO', active.player.name, gameData)

        if (infiniteLoop(active, pickedCards.bank)){
            console.log('INFINITE LOOP RESET PICKED CARDS')
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
        console.log('RECURSUIION', recursions);
        if (recursions.length >= 3){
            console.log('INIFINITE LOOP');
            // return true
            fail = true
        }
    })

    return fail
}


export function setPlayerPass(){
    gameData.players[0].data.pass = true;
    // gameData.pickedHand = null;
    // gameData.pickedBank = null;
    gameData.pickedHand = [];
    gameData.pickedBank = [];
    // nextPlayer()
}


// HOST FUNCTION //
let round = 1;
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

        console.log('ROUND:', round);
        if (gameData.activePlayerId == 'auto-3'){
            round +=1;
        }
        // console.log('GAME DATA', gameData)
        printGameData()

        if (playerPass(gameData.players[index])){
            // gameData.activePlayerId = gameData.players[index].data.connectionId;
            // gameData.players[index].data.active = true;
            setNextPlayerActive();
        }

    }
}

function printGameData(){
    console.log(`pickedHand: ${gameData.pickedHand}`);
    console.log(`pickedBank: ${gameData.pickedBank}`);
    console.log(`endOfGame: ${gameData.endOfGame}`);
    console.log(`Active Player: ${gameData.prevActivePlayerId}`);
    // gameData.players.forEach(player => {
    //     console.log(`NAME: ${player.name}`);
    //     console.log(`ACTIVE: ${player.data.active}`);
    //     console.log(`PASS: ${player.data.pass}`);
    //     console.log('-----------------------------------------------------')
    // })
    console.log('#########################################################')
}
// On endGame setNextPlayerActive is waiting on playerPassCheck to continue //

function playerPass(active){
    const allPlayerPass = gameData.players.every(player => player.data.pass);
    if (allPlayerPass){
        // console.log('playerPass END OF GAME');
        gameData.endOfGame = true;
        // a bit counter intuative, but this is to stop inifinite recursion of nextPlayer() //
        return false
        // endGame()
    }
    else{
        if (active.data.pass){
            return true
        }
        else {
            return false
        }
    }
}


// function playerPassCheck(active){
//     if (active.data.pass){
//         return false
//     }
//     else {
//         return true
//     }
// }