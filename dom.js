import {gameData} from './dataHandler.js';
import {initializeGame} from './dataHandler.js';
import {scoring} from './dataHandler.js';
import {nextGame} from './dataHandler.js';
import {leaveGame} from './dataHandler.js';
// import * as dataHandler from './dataHandler.js';
import {returnPlayerList} from './playerHandler.js';
import {nextPlayer} from './playerHandler.js';
import {setPlayerPass} from './playerHandler.js';
import {isAutoPlayerNext} from './playerHandler.js';
// import * as playerHandler from './playerHandler.js';
import {setupConnection} from './p2p.js';
// import * as p2p from './p2p.js';


// export function createNameInput(cb) {
//     const notepad = document.createElement('div');
//     notepad.id = 'notepad';

//     const img = document.createElement('img');
//     img.className = 'notepad-img';
//     img.src = './src/img/notepad.png';
//     img.alt = 'notepad'
 
//     const noteInfo = document.createElement('div');
//     noteInfo.className = 'notepad';

//     const noteTitle = document.createElement('div');
//     noteTitle.className = 'notepad-title';
//     noteTitle.innerText = 'Welcome to 31 The Card Game';

//     const noteBreak = document.createElement('br');

//     const input = document.createElement('input');
//     input.type = 'text';
//     input.id = 'player-name-input';
//     input.placeholder = 'Enter Your Name Here';

//     const button = document.createElement('button');
//     button.id = 'next-btn';
//     button.className = 'notepad-btn';
//     button.innerText = 'Next';

//     button.addEventListener('click', e => {
//         cb(input.value);
//         button.innerText = 'Checking for host...';
//         button.disabled = true;

//     })

//     noteInfo.append(noteTitle, noteBreak, input, noteBreak, button);
//     notepad.append(img, noteInfo)
    
//     return notepad;
// }


export function createNameInput(cb){
    const notepad = `
    <div id="notepad">
    <img class="notepad-img" src="./src/img/notepad.png" alt="notepad">
        <div class="notepad">
            <div class="notepad-title">Welcome to 31 The Card Game</div>
            <br>
            <input type="text" id="player-name-input" placeholder="Enter Your Name Here">
            <br>
            <button id="next-btn" class="notepad-btn">Next</button>
        </div>
    </div>
    `
    const table = document.getElementById('table');
    table.innerHTML = notepad;

    const input = document.getElementById('player-name-input');

    const button = document.getElementById('next-btn');
    button.addEventListener('click', e => {
        cb(input.value);
        button.innerText = 'Checking for host...';
        button.disabled = true;

    })
}


export function handleNameSubmitted(playerName) {
    setupConnection(playerName);
}

function createPlayerList() {
    let playerList = ''
    returnPlayerList().forEach(player => playerList = `${playerList}<div class="notepad-text">${player}</div>`);
    return playerList;
}

function createPlayerCoffees() {
    let playerCoffees = ''
    returnPlayerList().forEach((player, index) => playerCoffees = `${playerCoffees}<img id="cup-0${index+1}" src="./src/img/coffeecup_02.png" alt="coffee cup">`);
    return playerCoffees;
}

export function createWaitingRoom(){
    const notepad = `
    <div id="notepad">
        <img class="notepad-img" src="./src/img/notepad.png" alt="notepad">
        <div class="notepad">
            <div class="notepad-title">This is the Waiting Room</div>
            <br>
            ${createPlayerList()}
            ${canStartGame()}
        </div>
    </div>
    ${createPlayerCoffees()}
    `

    const table = document.getElementById('table');
    table.innerHTML = notepad;

    createStartEvent();

}


function canStartGame(){
    if (gameData.players[0].data.connectionId === gameData.hostName){
        return '<button id="start-game-btn" class="notepad-btn">Start Game</button>';
    }
    else {
        return '';
    }
}


function createStartEvent(){
    const startGameBtn = document.getElementById('start-game-btn');

    if (startGameBtn){
        startGameBtn.addEventListener('click', () => {
            initializeGame();
        })
    }
}


export function renderApp(component) {
    document.getElementById('table').replaceChildren(component);
}



function createPlayfield(){
    const playfield = document.createElement('div')
    playfield.id = 'playfield'
    playfield.classList.add('playfield')

    const buttonWrapper = document.createElement('div');
    buttonWrapper.id = 'btn-wrapper';
    playfield.appendChild(buttonWrapper);

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



// export function createWaitingRoom(){
//     const notepad = document.createElement('div');
//     notepad.id = 'notepad';

//     const img = document.createElement('img');
//     img.className = 'notepad-img';
//     img.src = './src/img/notepad.png';
//     img.alt = 'notepad'

//     const noteInfo = document.createElement('div');
//     noteInfo.className = 'notepad';

//     const noteTitle = document.createElement('div');
//     noteTitle.className = 'notepad-title';
//     noteTitle.innerText = 'Welcome to 31 The Card Game';

//     const noteBreak = document.createElement('br');
//     noteInfo.append(noteTitle, noteBreak, ...createPlayerList())

//     const startBtn = canStartGame()
//     if (startBtn){
//         noteInfo.append(startBtn())
//     }

//     notepad.append(img, noteInfo);
    
//     return notepad
// }


// export function createWaitingRoom(){
//     const waitingRoomDiv = document.createElement('div');
//     waitingRoomDiv.id = 'waiting-room';
//     waitingRoomDiv.append(...createPlayerList())

//     const startBtn = canStartGame()
//     if (startBtn){
//         waitingRoomDiv.append(startBtn())
//     }
    
//     return waitingRoomDiv
// }


// function canStartGame(){
//     if (gameData.players[0].data.connectionId === gameData.hostName){
//         return createStartGameBtn;
//     }
//     else {
//         return null;
//     }
// }


// function createStartGameBtn(){
//     const startGameBtn = document.createElement('button');
//     startGameBtn.className = 'notepad-btn'
//     startGameBtn.innerText ='Start Game';
    
//     startGameBtn.addEventListener('click', () => {
//         initializeGame();
//     })
//     return startGameBtn
// }


// function createPlayerList() {
//     return returnPlayerList().map(player => createPlayerListItem(player))
// }


// function createPlayerListItem(player) {
//     const playerDiv = document.createElement('div');
//     // const playerHeading = document.createElement('h2');
//     playerDiv.innerText = player;
//     playerDiv.className = 'notepad-text'
//     // playerDiv.appendChild(playerHeading);
//     return playerDiv;
// }


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
        const btn = `<button id="play-cards-btn">Play Cards</button>`
        // document.getElementById('playfield').insertAdjacentHTML('afterbegin', btn);
        document.getElementById('btn-wrapper').insertAdjacentHTML('afterbegin', btn);
        

        document.getElementById('play-cards-btn').addEventListener('click', () => {
        removeBtn();
        removeClicked();
        nextPlayer();
        })
    }
    
}


export function createPassBtn(){
    if(!document.getElementById('player-pass')){
        const btn = `<button id="player-pass-btn">Hold Cards</button>`
        // document.getElementById('playfield').insertAdjacentHTML('afterbegin', btn);
        document.getElementById('btn-wrapper').insertAdjacentHTML('afterbegin', btn);
    
        document.getElementById('player-pass-btn').addEventListener('click', () => {
            removeBtn();
            removeClicked();
            setPlayerPass();
            nextPlayer();
        })
    }

}

export function createSwapBankBtn(){
    if(!document.getElementById('swap-bank')){
        const btn = `<button id="swap-bank-btn">Swap Bank</button>`
        // document.getElementById('playfield').insertAdjacentHTML('afterbegin', btn);
        document.getElementById('btn-wrapper').insertAdjacentHTML('afterbegin', btn);
    
        document.getElementById('swap-bank-btn').addEventListener('click', () => {
            removeBtn();
            removeClicked();
            const player = gameData.players[0];
            player.data.pass = true;
            const bank = gameData.players[4];
            gameData.pickedHand = player.data.cards;
            gameData.pickedBank = bank.data.cards;
            nextPlayer();
        })
    }

}


export function removeBtn(){
    document.querySelectorAll(['#player-pass-btn', '#play-cards-btn', '#swap-bank-btn', '#last-turn']).forEach(elem => {
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
    const result = scoring();
    // console.log('SCORING' ,result);
    const scoreBoard = document.createElement('div');
    scoreBoard.id = 'score-board';
    let firstPart = `
        <div class="score-title">Round Winner(s)</div>
        <div class="score">Winning Score: ${result.score}</div>`
        result.roundWinners.forEach(player => {
            if(player.data.connectionId != 'bank'){
                firstPart = `${firstPart}<div class="winner">${player.name}</div>`
                const playerLabel = document.querySelectorAll(`.player-${player.location}`)[0];
                playerLabel.className = `player-label player-${player.location} player-wins`
            }
            
        })
    
    
    let secondPart = `
        <div class="score-title">Game Winner(s)</div>
        <div class="wins">Number of Wins: ${result.wins}</div>`
        result.gameWinners.forEach(player => {secondPart = `${secondPart}<div class="winner">${player.name}</div>`})
    

    const htmlString = `${firstPart}${secondPart}`;
    scoreBoard.insertAdjacentHTML('afterbegin',htmlString);
    scoreBoard.append(createNextGameBtn());
    scoreBoard.append(createLeaveGameBtn());

    const playFieldElem = document.getElementById('playfield');
    playFieldElem.append(scoreBoard);
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
                isAutoPlayerNext();
            }
            
        } 
    })
    
}


function createNextGameBtn(){
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'next-game-btn'
    button.innerText = 'Next Game';

    const btnWrap = document.createElement('div');
    btnWrap.append(button);
   
    button.addEventListener('click', e => {
        button.innerText = 'Waiting Room...';
        button.disabled = true;
        nextGame();
        

    })
    // return button;
    return btnWrap;
}


function createLeaveGameBtn(){
    const button = document.createElement('button')
    button.type = 'button';
    button.id = 'leave-game-btn';
    button.innerText = 'Leave Game';

    const btnWrap = document.createElement('div');
    btnWrap.append(button);
   
    button.addEventListener('click', () => {
        leaveGame(gameData.players[0]);
    })
    // return button;
    return btnWrap;
}
