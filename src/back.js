/* back.js — Back-side auto-rating bridge + example list rendering */

import { parseExamples, parseTranslation } from './parse.js';

// Auto-rating bridge
(function() {
    var ease = window.__quizifyEase;
    if (ease) {
        delete window.__quizifyEase;
        setTimeout(function() { window.__rateCard(ease); }, 0);
    }
})();

// Example list rendering (back side)
(function() {
    var rawEl = document.querySelector('.quizify-example-list .quizify-example-list__raw');
    if (!rawEl) return;
    var raw = rawEl.innerHTML;
    if (!raw || !raw.trim()) return;
    var examples = parseExamples(raw);
    var trRawEl = document.querySelector('.quizify-example-translation__raw');
    var translations = trRawEl ? parseTranslation(trRawEl.innerHTML) : [];
    for (var ti = 0; ti < examples.length; ti++) {
        examples[ti].translation = translations[ti] || null;
    }
    if (examples.length === 0) return;

    var knownCount = 0;
    var stateStr = window.__quizifyRevealState;
    if (stateStr) {
        var parts = stateStr.split(':');
        knownCount = parseInt(parts[0]) || 0;
        delete window.__quizifyRevealState;
    }

    var summaryEl = document.querySelector('.quizify-example-list .quizify-example-list__summary');
    if (summaryEl) {
        summaryEl.textContent = '认识了 ' + knownCount + '/' + examples.length + ' 个例句';
    }

    var itemsEl = document.querySelector('.quizify-example-list .quizify-example-list__items');
    if (!itemsEl) return;
    for (var i = 0; i < examples.length; i++) {
        var item = document.createElement('div');
        item.className = 'quizify-example-list__item quizify-example-list__item--visible';
        if (i < knownCount) {
            item.className += ' quizify-example-list__item--known';
        } else {
            item.className += ' quizify-example-list__item--unrevealed';
        }
        var indicator = document.createElement('span');
        if (examples[i].audio) {
            indicator.className = 'quizify-audio-indicator quizify-audio-indicator--available';
            indicator.textContent = '▶';
            var audioEl = document.createElement('audio');
            audioEl.src = examples[i].audio;
            audioEl.preload = 'none';
            audioEl.style.display = 'none';
            item.appendChild(indicator);
            item.appendChild(audioEl);
            item.addEventListener('click', (function(el) {
                return function() { var a = el.querySelector('audio'); if (a) { a.pause(); a.currentTime = 0; a.play(); } };
            })(item));
        } else {
            indicator.className = 'quizify-audio-indicator quizify-audio-indicator--muted';
            indicator.textContent = '⊘';
            item.appendChild(indicator);
        }
        var mark = document.createElement('span');
        if (i < knownCount) {
            mark.className = 'quizify-example-list__result-mark quizify-example-list__result-mark--known';
            mark.textContent = '✓';
        } else {
            mark.className = 'quizify-example-list__result-mark quizify-example-list__result-mark--unrevealed';
            mark.textContent = '✗';
        }
        item.appendChild(mark);
        var textSpan = document.createElement('span');
        textSpan.className = 'quizify-example-list__item-text';
        textSpan.textContent = examples[i].text;
        item.appendChild(textSpan);
        if (examples[i].translation) {
            var trSpan = document.createElement('span');
            trSpan.className = 'quizify-example-list__item-translation';
            trSpan.textContent = examples[i].translation;
            item.appendChild(trSpan);
        }
        itemsEl.appendChild(item);
    }
})();
