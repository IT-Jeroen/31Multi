/////////////////////////// GAME INTRO PAGE /////////////////////////////////

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
    setupConnection(playerName);
}


function renderApp(component) {
    document.getElementById('root').replaceChildren(component);
}

renderApp(createNameInput(handleNameSubmitted));


////////////////////////// CHECK FOR EXISTING HARD CODED HOST ////////////////////////////////

const hostName = '31-multi-host-id';
const connections = []


function testHost(playerName){
    return new Promise((resolve, reject) => {
        const peer = new Peer(null, {
            debug: 2
        })

        peer.on('open', function (id) {
            // console.log('TEST PEER', peer)
            const connection = peer.connect(hostName, {
                reliable: true
            })
            connection.metadata = playerName;

            peer.on('error', err => {
                if (err.type === 'peer-unavailable'){
                    resolve({p: peer, c: null, ishost: true})
                }
                else {
                    reject(err)
                }
            })
            connection.on('open', ()=> resolve({p: peer, c:connection, ishost: false}))

        })
    })
}


function setupConnection(playerName){
    const p2pObject = testHost(playerName)

    p2pObject
    .then(result => {
        if (!result.ishost){
            console.log('HOST FOUND')
            setConnectionEvents(result.c)
            renderApp(createWaitingRoom(playersList(),result.p.id));
        }
        else{
            result.p.destroy();
            connections.length = 0;
            setAsHost(playerName);
        }
        
    })
    .catch(err => {
        console.log('PEER ERROR', err); 
    }) 
}


function setAsHost(playerName){
    // console.log('SET AS HOST')
    connections.push({name:playerName, c: null});
    renderApp(createWaitingRoom(playersList(), hostName));

    const peer = new Peer(hostName, {
        debug: 2
        })

    peer.on('connection', (c)=>{
        connections.push({name: c.metadata, c: c});
        // console.log('Connections:', connections);

        connections.forEach(item => {
            pushData(item.c, playersList())
        })

        renderApp(createWaitingRoom(playersList(), hostName))
    })

    peer.on('error', err => {console.log('PEER ERROR:', err)});

}


function setConnectionEvents(c) {

    c.on('data', function (data) {
        // console.log("Data recieved:", data);
        renderApp(createWaitingRoom(data), c.peer.id)
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

function createWaitingRoom(data, peerName){
    const waitingRoomDiv = document.createElement('div');
    waitingRoomDiv.id = 'waiting-room';
    waitingRoomDiv.append(...createPlayerList(data))

    if (peerName === hostName){
        const startGameBtn = document.createElement('button');
        startGameBtn.innerText ='Start Game';
        waitingRoomDiv.appendChild(startGameBtn);
    }
    
    return waitingRoomDiv
}


function createPlayerList(playerNames) {
    // console.log('PLAYER NAMES', playerNames);
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




