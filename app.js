import {renderApp} from './dom.js';
import {createNameInput} from './dom.js';
import {handleNameSubmitted} from './dom.js';
// import * as dom from './dom.js';

// dom.renderApp(dom.createNameInput(dom.handleNameSubmitted));
renderApp(createNameInput(handleNameSubmitted));