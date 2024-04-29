import { gameData, initializeGame, scoring, nextGame, leaveGame } from './dataHandler.js';
import { returnPlayerList, nextPlayer, setPlayerPass, isAutoPlayerNext } from './playerHandler.js';
import { setupConnection } from './p2p.js';


export function createNameInput(event){
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

    event();
}


export function nameInputEvent(){
    const input = document.getElementById('player-name-input');

    const button = document.getElementById('next-btn');
    button.addEventListener('click', e => {
        setupConnection(input.value);
        button.innerText = 'Checking for host...';
        button.disabled = true;

    })
}


export function resetNameEntry(){
    const input = document.getElementById('player-name-input');
    input.value = '';
    input.placeholder = 'No Place Available at this Time';
    const button = document.getElementById('next-btn');
    button.innerText = 'Next';
    button.disabled = false;
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



export function createWaitingRoom(event){
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

    event();
}


function canStartGame(){
    if (gameData.players[0].data.connectionId === gameData.hostName){
        return '<button id="start-game-btn" class="notepad-btn">Start Game</button>';
    }
    else {
        return '';
    }
}


export function startGameEvent(){
    const startGameBtn = document.getElementById('start-game-btn');

    if (startGameBtn){
        startGameBtn.addEventListener('click', () => {
            gameData.gameStatus = 'in-progress';
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
    // const removeInactive = [...document.getElementsByClassName('player-label')];
    const removeInactive = [...document.getElementsByClassName('label-wrapper')];
    removeInactive.forEach(label => label.remove());
}


function setPlayerLabels(player){
    const playFieldElem = document.getElementById('playfield');

    if(player.name != 'Bank'){
        if(player.data.active){
            if(player.location != 'south' && !player.data.pass){
                const activeLabel = `
                <div class="label-wrapper player-${player.location}">
                    <div class="player-label player-active">
                        ${player.name}
                    </div>
                </div>`
                playFieldElem.insertAdjacentHTML('afterbegin',activeLabel);
            }
        }

        if(player.data.pass){
            const passLabel = `
            <div class="label-wrapper player-${player.location}">
                <div class="player-label player-pass">
                    ${player.name}
                </div>
            </div>`
            playFieldElem.insertAdjacentHTML('afterbegin',passLabel);
        }

        if (!player.data.active && !player.data.pass){
            const inActiveLabel = `
            <div class="label-wrapper player-${player.location}">
                <div class="player-label">
                    ${player.name}
                </div>
            </div>`
            playFieldElem.insertAdjacentHTML('afterbegin',inActiveLabel);
        }

    }
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
            createPlayCardsBtn(playCardsEvent);
        }
    }
}


function createPlayCardsBtn(event){
    if (!document.getElementById('play-cards-btn')){
        const btn = `<button id="play-cards-btn">Play Cards</button>`
        document.getElementById('btn-wrapper').insertAdjacentHTML('afterbegin', btn);
        
        event();
    }
}


function playCardsEvent(){
    document.getElementById('play-cards-btn').addEventListener('click', () => {
        removeBtn();
        removeClicked();
        nextPlayer();
        })
}


function createPassBtn(event){
    if(!document.getElementById('player-pass-btn')){
        const btn = `<button id="player-pass-btn">Hold Cards</button>`
        document.getElementById('btn-wrapper').insertAdjacentHTML('afterbegin', btn);
        
        event()
    }
    
}


function passEvent(){
    document.getElementById('player-pass-btn').addEventListener('click', () => {
        removeBtn();
        removeClicked();
        setPlayerPass();
        nextPlayer();
    })
}


function createSwapBankBtn(event){
    if(!document.getElementById('swap-bank-btn')){
        const btn = `<button id="swap-bank-btn">Swap Bank</button>`
        document.getElementById('btn-wrapper').insertAdjacentHTML('afterbegin', btn);
        
        event()
    }
    
}


function swapBankEvent(){
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
}


function lastTurnEvent(playerName){
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
        createPassBtn(passEvent)
        createSwapBankBtn(swapBankEvent)
    }

    if (gameData.endOfGame){
        removeBtn();
        flipAllCards();
        setTimeout(()=> createScoreboard(nextGameEvent, leaveGameEvent), 600)
    }
}


export function flipAllCards(){
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const classStr = card.className;
        card.className = `${classStr}-open`;
    })
}


export function startGame(){
    renderApp(createPlayfield());
    handOutDeckCards(300).then(() => {
        updatePlayerLabels();
        if (gameData.players[0].data.active){
            createPassBtn(passEvent)
            createSwapBankBtn(swapBankEvent)
        }
        else {
            if (gameData.players[0].data.connectionId == gameData.hostName){
                isAutoPlayerNext();
            }
            
        } 
    })
    
}


function createScoreboard(next, leave){
    const result = scoring();

    let roundWinners = '';
    result.roundWinners.forEach(player => {
        if(player.data.connectionId != 'bank'){
            roundWinners = `${roundWinners}<div class="notepad-text">${player.name}: score ${result.score}</div>`
            const labelWrapper = document.querySelectorAll(`.player-${player.location}`)[0];
            const playerLabel = labelWrapper.querySelectorAll('.player-label')[0];
            playerLabel.className = `player-label player-wins`
        }
        
    })

    let gameWinners = '';
    result.gameWinners.forEach(player => {gameWinners = `${gameWinners}<div class="notepad-text">${player.name}: wins ${result.wins}</div>`})

    const scoreBoard = `
    <div id="notepad" class="scoreboard">
        <img class="notepad-img" src="./src/img/notepad.png" alt="notepad">
        <div class="notepad">
            <div class="notepad-title">Round Winner(s)</div>
            ${roundWinners}
            <div class="notepad-title">Game Winner(s)</div>
            ${gameWinners}
            <button id="next-game-btn" class="scoreboard-btns">Next Game</button>
            <button id="leave-game-btn" class="scoreboard-btns">Leave Game</button>
        </div>
    </div>
    `
    
    const table = document.getElementById('table')
    table.insertAdjacentHTML('afterbegin',scoreBoard);

    next()
    leave()
}


function nextGameEvent(){
    const button = document.getElementById('next-game-btn');

    if (button){
        button.addEventListener('click', e => {
            button.innerText = 'Waiting Room...';
            button.disabled = true;
            nextGame();
            

        })
    }
}


function leaveGameEvent(){
    const button = document.getElementById('leave-game-btn');

    if(button){
        button.addEventListener('click', () => {
            leaveGame(gameData.players[0]);
        })
    }
}