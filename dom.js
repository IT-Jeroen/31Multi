import {gameData} from './dataHandler.js';
import * as dataHandler from './dataHandler.js';
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
        if(player.data.active){
            if(player.location != 'south' && !player.data.pass){
                const activeLabel = `
                <div class="player-label player-${player.location} player-active">
                    ${player.name}
                </div>`
                playFieldElem.insertAdjacentHTML('afterbegin',activeLabel);
            }
        }

        if(player.data.pass){
            const passLabel = `
            <div class="player-label player-${player.location} player-pass">
                ${player.name}
            </div>`
            playFieldElem.insertAdjacentHTML('afterbegin',passLabel);
        }

        if (!player.data.active && !player.data.pass){
            const inActiveLabel = `
            <div class="player-label player-${player.location}">
                ${player.name}
            </div>`
            playFieldElem.insertAdjacentHTML('afterbegin',inActiveLabel);
        }

    }
}


export function createWaitingRoom(){
    const waitingRoomDiv = document.createElement('div');
    waitingRoomDiv.id = 'waiting-room';
    waitingRoomDiv.append(...createPlayerList())

    const startBtn = canStartGame()
    if (startBtn){
        waitingRoomDiv.append(startBtn())
    }

    // const leaveGameBtn = createLeaveGameBtn();
    // waitingRoomDiv.append(leaveGameBtn); 
    
    return waitingRoomDiv
}


function canStartGame(){
    if (gameData.players[0].data.connectionId === gameData.hostName){
        return createStartGameBtn;
    }
    else {
        return null;
    }
}


function createStartGameBtn(){
    const startGameBtn = document.createElement('button');
    startGameBtn.innerText ='Start Game';
    
    startGameBtn.addEventListener('click', () => {
        dataHandler.initializeGame();
    })
    return startGameBtn
}


function createPlayerList() {
    return playerHandler.returnPlayerList().map(player => createPlayerListItem(player))
    // return gameData.waitingRoom.map(player => createPlayerListItem(player));
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


// LOCAL FUNCTION //
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


// Actuall Trigger for the Deck CSS Animation //
function handOutDeckCards(timing=0){
    return new Promise((resolve, reject) => {
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
                resolve(true)
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

    })

}


function cardClickEvent(e){
    const classes = e.currentTarget.classList;
    const south = classes.contains('south');
    const center = classes.contains('center');

    if (gameData.players[0].data.active && !gameData.endOfGame){
        if (south){
            if (gameData.pickedHand[0]){
                document.getElementById(gameData.pickedHand[0]).classList.remove('clicked');
            }
            gameData.pickedHand = [e.currentTarget.id];
    
            e.currentTarget.classList.add('clicked');
        }
    
        if (center){
            if (gameData.pickedBank[0]){
                document.getElementById(gameData.pickedBank[0]).classList.remove('clicked');
            }
    
            gameData.pickedBank = [e.currentTarget.id];
            e.currentTarget.classList.add('clicked');
        }

        if (gameData.pickedBank[0] && gameData.pickedHand[0]){
            createPlayCardsBtn()
        }
    }
}


function createPlayCardsBtn(){
    if (!document.getElementById('play-cards')){
        const btn = `<button id="play-cards">Play Cards</button>`
        document.getElementById('playfield').insertAdjacentHTML('afterbegin', btn);

        document.getElementById('play-cards').addEventListener('click', () => {
        removeBtn();
        removeClicked();
        playerHandler.nextPlayer();
        })
    }
    
}


export function createPassBtn(){
    if(!document.getElementById('player-pass')){
        const btn = `<button id="player-pass">PASS</button>`
        document.getElementById('playfield').insertAdjacentHTML('afterbegin', btn);
    
        document.getElementById('player-pass').addEventListener('click', () => {
            removeBtn();
            removeClicked();
            playerHandler.setPlayerPass();
            playerHandler.nextPlayer();
        })
    }

}

export function createSwapBankBtn(){
    if(!document.getElementById('swap-bank')){
        const btn = `<button id="swap-bank">SWAP BANK</button>`
        document.getElementById('playfield').insertAdjacentHTML('afterbegin', btn);
    
        document.getElementById('swap-bank').addEventListener('click', () => {
            removeBtn();
            removeClicked();
            const player = gameData.players[0];
            player.data.pass = true;
            const bank = gameData.players[4];
            gameData.pickedHand = player.data.cards;
            gameData.pickedBank = bank.data.cards;
            playerHandler.nextPlayer();
        })
    }

}


export function removeBtn(){
    document.querySelectorAll(['#player-pass', '#play-cards', '#swap-bank', '#last-turn']).forEach(elem => {
        elem.remove()
    })
}


function removeClicked(){
    document.querySelectorAll('.clicked').forEach(elem => {
        elem.classList.remove('clicked');
    })
}


export function swapDomCards(){
    if (gameData.pickedBank.length == gameData.pickedHand.length){
        gameData.pickedBank.forEach((card,index) => {
            const cardHand = document.getElementById(gameData.pickedHand[index]);
            const cardBank = document.getElementById(card);
            
            const handCss = cardHand.className;
            const bankCss = cardBank.className;
    
            cardHand.className = bankCss;
            cardBank.className = handCss;
        })
    }
    else {

    }

}


function lastTurnEvent(playerName){
    console.log(`LAST TURN ${playerName}`);
    const playFieldElem = document.getElementById('playfield');
    const lastTurnLabel = `
        <div id=last-turn class="player-label last-turn player-active">
            LAST TURN ${playerName}!
        </div>`
        playFieldElem.insertAdjacentHTML('afterbegin',lastTurnLabel);
}


export function updateDomGame(){
    swapDomCards()
    updatePlayerLabels();

    if (gameData.lastTurn){
        lastTurnEvent(gameData.lastTurn);
    }

    if (gameData.players[0].data.active && !gameData.players[0].data.pass){
        createPassBtn();
        createSwapBankBtn();
    }

    if (gameData.endOfGame){
        removeBtn();
        flipAllCards(); 
        createScoreboard();
    }
}


export function flipAllCards(){
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const classStr = card.className;
        card.className = `${classStr}-open`;
    })
}


export function createScoreboard(){
    const result = dataHandler.scoring();
    console.log(result)
    let firstPart = `
        <div class="score-board">
        <div class="score-title">Round Winner(s)</div>
        <div class="score">Winning Score: ${result.score}</div>`
        result.roundWinners.forEach(player => {
            firstPart = `${firstPart}<div class="winner">${player.name}</div>`
            const playerLabel = document.querySelectorAll(`.player-${player.location}`)[0];
            playerLabel.className = `player-label player-${player.location} player-wins`
        })
    
    
    let secondPart = `
        <div class="score-title">Game Winner(s)</div>
        <div class="wins">Number of Wins: ${result.wins}</div>`
        result.gameWinners.forEach(player => {secondPart = `${secondPart}<div class="winner">${player.name}</div>`})
    
    const htmlString = `${firstPart}${secondPart}</div>`;
    const playFieldElem = document.getElementById('playfield');

    playFieldElem.insertAdjacentHTML('afterbegin',htmlString);
    playFieldElem.append(createNextGameBtn());
    playFieldElem.append(createLeaveGameBtn());

}


export function startGame(){
    renderApp(createPlayfield());
    handOutDeckCards(300).then(() => {
        updatePlayerLabels();
        if (gameData.players[0].data.active){
            createPassBtn();
            createSwapBankBtn();
        }
        else {
            if (gameData.players[0].data.connectionId == gameData.hostName){
                playerHandler.isAutoPlayerNext();
            }
            
        } 
    })
    
}

function createNextGameBtn(){
    const button = document.createElement('button')
    button.type = 'button';
    button.innerText = 'Next Game';
   
    button.addEventListener('click', e => {
        button.innerText = 'Waiting Room...';
        button.disabled = true;
        dataHandler.nextGame();
        

    })
    return button;
}

function createLeaveGameBtn(){
    const button = document.createElement('button')
    button.type = 'button';
    button.innerText = 'Leave Game';
   
    button.addEventListener('click', () => {
        dataHandler.leaveGame(gameData.players[0]);
        // // reset browser //
        // setTimeout(()=> window.location.reload(), 1000);

    })
    return button;
}
