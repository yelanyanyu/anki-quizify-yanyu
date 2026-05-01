/* index.js — Entry point. esbuild bundles all src/*.js into _quizify.js */

// Each module registers globals (window.__xxx) via side-effect imports
import './platform.js';
import './back.js';
import { frontInit } from './front.js';

// Auto-init on front side
if (document.querySelector('.quizify-example-list__raw') && document.querySelector('.quizify-example-list__controls')) {
    frontInit();
}
