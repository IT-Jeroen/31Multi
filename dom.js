// 'dataHandler.js'
import {gameData} from './dataHandler.js';
import * as dataHandler from './dataHandler.js';
// const gameData = dataHandler.gameData;
// 'players.js'
// import {players} from 'players.js';
import * as playerHandler from './playerHandler.js';
import * as p2p from './p2p.js';


export function createNameInput(cb) {
    const wrapper = document.createElement('div')
    
    const label = document.createElement('label')
    label.innerText = 'Enter Name'
    
    const input = document.createElement('input')
    input.type = 'text';
    
    const button = document.createElement('button')
    button.type = 'button';
    button.innerText = 'Next';
   
    button.addEventListener('click', e => {
        cb(input.value);
        button.innerText = 'Checking for host...';
        button.disabled = true;

    })

    
    wrapper.append(label, input, button)
    
    return wrapper;
}


export function handleNameSubmitted(playerName) {
    p2p.setupConnection(playerName);
}


export function renderApp(component) {
    document.getElementById('table').replaceChildren(component);
}



function createPlayfield(){
    const playfield = document.createElement('div')
    playfield.id = 'playfield'
    playfield.classList.add('playfield')

    createDeck(playfield)

    return playfield
}

// 'gameData' 'dataHandler.js'
export function updatePlayerLabels(){
    removePlayerLabels();
    gameData.players.forEach(player => {
        setPlayerLabels(player);
    })
}


function removePlayerLabels(){
    const removeInactive = [...document.getElementsByClassName('player-label')];
    removeInactive.forEach(label => label.remove());
}


function setPlayerLabels(player){
    const playFieldElem = document.getElementById('playfield');

    if(player.name != 'Bank'){

        if(!player.data.active){
            const inActiveLabel = `
            <div class="player-label player-${player.location}">
                ${player.name}
            </div>`
            playFieldElem.insertAdjacentHTML('afterbegin',inActiveLabel);
            
        }

        else {
            if(player.location != 'south'){
                const activeLabel = `
                <div class="player-label player-${player.location} player-active">
                    ${player.name}
                </div>`
                playFieldElem.insertAdjacentHTML('afterbegin',activeLabel);
            }
        }
    }
}

//////////////////////////////////// WAITNG ROOM /////////////////////////////////////////////////

export function createWaitingRoom(){
    const waitingRoomDiv = document.createElement('div');
    waitingRoomDiv.id = 'waiting-room';
    waitingRoomDiv.append(...createPlayerList())

    const startBtn = canStartGame()
    if (startBtn){
        waitingRoomDiv.append(startBtn())
    }
    
    return waitingRoomDiv
}

// 'gameData' 'dataHandler.js'
function canStartGame(){
    if (gameData.players[0].data.connectionId === gameData.hostName){
        return createStartGameBtn;
    }
    else {
        return null;
    }
}

// 'initializeGame' 'dataHandler.js'
function createStartGameBtn(){
    const startGameBtn = document.createElement('button');
    startGameBtn.innerText ='Start Game';
    
    startGameBtn.addEventListener('click', () => {
        dataHandler.initializeGame();
    })
    return startGameBtn
}

// 'returnPlayerList' 'playerHandler.js'
function createPlayerList() {
    return playerHandler.returnPlayerList().map(player => createPlayerListItem(player))
}


function createPlayerListItem(player) {
    const playerDiv = document.createElement('div');
    const playerHeading = document.createElement('h2');
    playerHeading.innerText = player;
    playerDiv.appendChild(playerHeading);
    return playerDiv;
}


function createCardElem(cardID){
    
    const cardElem = document.createElement('div');
    cardElem.classList.add('card')

    const frontElem = document.createElement('div');
    frontElem.classList.add('front')
    const frontImg = document.createElement('img');
    frontImg.src = `./src/img/${cardID}.png`;

    const backElem = document.createElement('div');
    backElem.classList.add('back')
    const backImg = document.createElement('img');
    backImg.src = './src/img/back-blue.png';

    frontElem.appendChild(frontImg);
    backElem.appendChild(backImg);
    cardElem.appendChild(frontElem);
    cardElem.appendChild(backElem);

    return cardElem;
}

// 'gameData' 'dataHandler.js'
// Local Function //
function createDeck(component){;
    const cardIDs = Object.keys(gameData.cards) 
    cardIDs.forEach(cardID => {

        const cardElem = createCardElem(cardID);
        cardElem.id = cardID
        cardElem.classList.add('deck')

        cardElem.addEventListener('click',e => {
            cardClickEvent(e)
        })
   
        component.appendChild(cardElem)

    })
}

// 'gameData' 'dataHandler.js'
// Actuall Trigger for the Deck CSS Animation //
function handOutDeckCards(timing=0){
    let i = 0;
    let playerIndex = 0;
    let cardIndex = 0;
    let numCardsToDeal = 0;
    
    gameData.players.forEach(player => {
        numCardsToDeal += player.data.cards.length;
    })


    const intervalID = setInterval(()=>{
        if (i == numCardsToDeal -1){
            clearInterval(intervalID);
        }
        
        let player = gameData.players[playerIndex];
        const cardID = player.data.cards[cardIndex];
        const card = document.getElementById(cardID)
        card.className = `card ${player.location}`
        playerIndex += 1;

        if (playerIndex == gameData.players.length){
            cardIndex += 1;
            playerIndex = 0;
        }

        i += 1;
    }, timing);
}

// 'gameData' 'dataHandler.js'
function cardClickEvent(e){
    const classes = e.currentTarget.classList;
    const south = classes.contains('south');
    const center = classes.contains('center');

    if (gameData.players[0].data.active){
        if (south){
            if (gameData.pickedHand){
                document.getElementById(gameData.pickedHand).classList.remove('clicked');
            }
            gameData.pickedHand = e.currentTarget.id;
    
            e.currentTarget.classList.add('clicked');
        }
    
        if (center){
            if (gameData.pickedBank){
                document.getElementById(gameData.pickedBank).classList.remove('clicked');
            }
    
            gameData.pickedBank = e.currentTarget.id;
            e.currentTarget.classList.add('clicked');
        }

        if (gameData.pickedBank && gameData.pickedHand){
            createPlayCardsBtn()
        }
    }
}


// 'netPlayer' 'playerHandler.js'
function createPlayCardsBtn(){
    const btn = `<button id="play-cards">Play Cards</button>`
    document.getElementById('playfield').insertAdjacentHTML('afterbegin', btn);

    document.getElementById('play-cards').addEventListener('click', () => {
        removePlayCardsBtn();
        playerHandler.nextPlayer();
    })
}


function removePlayCardsBtn(){
    document.getElementById('play-cards').remove();
}

// 'gameData' 'dataHandler.js'
export function swapDomCards(){
    if (gameData.pickedHand && gameData.pickedBank){
        const cardHand = document.getElementById(gameData.pickedHand);
        cardHand.classList.remove('clicked');
        const handCss = cardHand.className;

        const cardBank = document.getElementById(gameData.pickedBank);
        cardBank.classList.remove('clicked');
        const bankCss = cardBank.className

        cardHand.className = bankCss;
        cardBank.className = handCss;
        
    }
    else {
        console.log('Please Select Two Cards!');
    }
}

export function startGame(){
    renderApp(createPlayfield());
    handOutDeckCards(300);
    updatePlayerLabels();
}