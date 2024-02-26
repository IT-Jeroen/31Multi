/////////////////////////// GAME INTRO PAGE /////////////////////////////////

let playerName;

function createNameInput(cb) {
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

function handleNameSubmitted(playerName) {
    // renderApp(createNameInput(name))
    setupConnection(playerName);
}

function renderApp(component) {
    document.getElementById('root').replaceChildren(component);
}

renderApp(createNameInput(handleNameSubmitted));

/*const nextBtn = document.getElementById('next-btn');
const nameInput = document.getElementById('input-name');

nextBtn.addEventListener('click',(e) => {
    e.target.innerText = 'Checking for Host ...';
    e.target.setAttribute('disabled', '');
    playerName = nameInput.value
    // console.log('The name entered is:', nameInput.value);

    setupConnection()

})*/


////////////////////////// CHECK FOR EXISTING HARD CODED HOST ////////////////////////////////

const hostName = '31-multi-host-id';
let peer = null;
let lastPeerId = null;
// let conn = null;
const connections = []


// function testHost(){
//     let {promise, resolve, reject} = Promise.withResolvers();
//     peer = new Peer(null, {
//         debug: 2
//     })

//     peer.on('open', function (id) {
//         // console.log('TEST PEER', peer)
//         const connection = peer.connect(hostName, {
//             reliable: true
//         })
//         connection.metadata = playerName;

//         // console.log('TEST CONNECTION', connection)

//         peer.on('error', err => {reject(err)});
//         connection.on('open', ()=> resolve(connection))

//         // console.log('PROMISE:',promise)

//     })

//     return promise

// }

function testHost(playerName){
    return new Promise((resolve, reject) => {
        peer = new Peer(null, {
            debug: 2
        })

        peer.on('open', function (id) {
            console.log('TEST PEER', peer)
            const connection = peer.connect(hostName, {
                reliable: true
            })
            connection.metadata = playerName;

            console.log('TEST CONNECTION', connection)

            peer.on('error', err => {reject(err)});
            connection.on('open', ()=> resolve(connection))

        })
    })
}


function setupConnection(playerName){
    const result = testHost(playerName)

    result
    .then(connection => {
        console.log('HOST FOUND')
        // Add peer error EL when client peer //
        setConnectionEvents(connection)
        // createWaitingRoom(playersList());
        // setupWaitingRoomUi(playersList());
        renderApp(createWaitingRoom(playersList()));
    })
    .catch(err => {
        if (err.type === 'peer-unavailable'){
            setAsHost(playerName);
            // createWaitingRoom(playersList());
            // setupWaitingRoomUi(playersList());
            renderApp(createWaitingRoom(playersList()))
        }
        else {
            console.log('PEER ERROR', err);
        }   
    }) 
}


// Needs a con._open / close check to manage connections ??? //
function setAsHost(playerName){
    console.log('SET AS HOST')
    if (peer){
        peer.destroy();
        peer = null;
        // conn = null;
        connections.length = 0;
    }

    connections.push({name:playerName, c: null});

    peer = new Peer(hostName, {
        debug: 2 // set to 0 if not to print error to console
        })

    peer.on('connection', (c)=>{
        connections.push({name: c.metadata, c: c});
        // console.log('Connections:', connections);

        connections.forEach(item => {
            pushData(item.c, playersList())
        })

        // createWaitingRoom(playersList());
        // setupWaitingRoomUi(playersList());
        renderApp(createWaitingRoom(playersList()))
    })

    peer.on('error', err => {console.log('PEER ERROR:', err)});

}


function setConnectionEvents(c) {

    c.on('data', function (data) {
        // console.log("Data recieved:", data);
        // createWaitingRoom(data)
        // setupWaitingRoomUi(data)

        // At the moment data recieved is playersList //
        renderApp(createWaitingRoom(data))
    });

    c.on('close', function () {
        console.log('Connection reset, Awaiting connection...');
        // remove from array //
        connections = connections.filter(i=> i.name != c.peer);
        // console.log('Connections:', connections);
    });

    connections.push({name:playerName, c: c})
}


// Delayed Response in case connection is closed when still setting up in the background //
function pushData(c, data){
    if (c){
        if (!c._open){
            let counter = 0;
        
            const intervalID = setInterval(()=>{
                if (c._open){
                    clearInterval(intervalID);
                    c.send(data)
                }
                counter += 1;

                if (counter == 100){
                    clearInterval(intervalID);
                    console.log('PUSH DATA TIMEOUT')
                }

            }, 100)
        }
        else {
            c.send(data);
        }
    }
}


function playersList(){
    return connections.map(item => item.name)
}


//////////////////////////////////// WAITNG ROOM /////////////////////////////////////////////////

// function setupWaitingRoomUi(data) {
//     // console.log('CREATE WAITING ROOM')
//     // Remove Excisting Stuff //
//     const nameEntry = document.getElementById('name-entry');
//     const waitingRoom = document.getElementById('waiting-room');

//     removeElements([nameEntry, waitingRoom]);

//     const main = document.getElementsByTagName('main')[0]
//     main.appendChild(
//         createWaitingRoom(data)
//     )
// }

function createWaitingRoom(data){
    const waitingRoomDiv = document.createElement('div');
    waitingRoomDiv.id = 'waiting-room';
    waitingRoomDiv.append(...createPlayerList(data))

    if (peer.id === hostName){
        const startGameBtn = document.createElement('button');
        startGameBtn.innerText ='Start Game';
        waitingRoomDiv.appendChild(startGameBtn);
    }
    
    return waitingRoomDiv
}


function isHost(peer, hostName){
    if (peer.id === hostName){
        return true
    }
    return false
}


function createPlayerList(playerNames) {
    console.log('PLAYER NAMES', playerNames);
    return playerNames.map(player => createPlayerLabel(player))
}

function createPlayerLabel(player) {
    const playerDiv = document.createElement('div');
    const playerHeading = document.createElement('h2');
    playerHeading.innerText = player;
    playerDiv.appendChild(playerHeading);
    return playerDiv;
}

function removeElements(elems=[]){
    elems.forEach(elem => {
        if (elem){
            elem.remove()
        }
    })
    
}




