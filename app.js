// import * as p2p from './p2p.js';
import * as dom from './dom.js';


// function createNameInput(cb) {
//     const wrapper = document.createElement('div')
    
//     const label = document.createElement('label')
//     label.innerText = 'Enter Name'
    
//     const input = document.createElement('input')
//     input.type = 'text';
    
//     const button = document.createElement('button')
//     button.type = 'button';
//     button.innerText = 'Next';
   
//     button.addEventListener('click', e => {
//         cb(input.value);
//         button.innerText = 'Checking for host...';
//         button.disabled = true;

//     })

    
//     wrapper.append(label, input, button)
    
//     return wrapper;
// }


// function handleNameSubmitted(playerName) {
//     p2p.setupConnection(playerName);
// }


// function renderApp(component) {
//     document.getElementById('table').replaceChildren(component);
// }

dom.renderApp(dom.createNameInput(dom.handleNameSubmitted));