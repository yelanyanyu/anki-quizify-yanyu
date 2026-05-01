/* front.js — State, DOM rendering, button handlers, init, module publish */

import { parseExamples } from './parse.js';

var __state = { phase: 'initial', currentIndex: 0, examples: [], totalCount: 0 };

// ---- Example item HTML via DOM API (no HTML closing tags in JS strings) ----
function buildItemHTML(item, i) {
    var div = document.createElement('div');
    div.className = 'quizify-example-list__item quizify-example-list__item--hidden';
    div.setAttribute('data-index', i);
    div.setAttribute('onclick', 'window.QuizifyNestedReveal.playItemAudio(this);return false;');
    var indicator = document.createElement('span');
    if (item.audio) {
        indicator.className = 'quizify-audio-indicator quizify-audio-indicator--available';
        indicator.textContent = '▶';
        var audio = document.createElement('audio');
        audio.src = item.audio;
        audio.preload = 'none';
        audio.style.display = 'none';
        div.appendChild(indicator);
        div.appendChild(audio);
    } else {
        indicator.className = 'quizify-audio-indicator quizify-audio-indicator--muted';
        indicator.textContent = '⊘';
        div.appendChild(indicator);
    }
    var textSpan = document.createElement('span');
    textSpan.className = 'quizify-example-list__item-text';
    textSpan.textContent = item.text;
    div.appendChild(textSpan);
    return div.outerHTML;
}

function renderAllItems() {
    var h = '';
    for (var j = 0; j < __state.totalCount; j++) h += buildItemHTML(__state.examples[j], j);
    return h;
}

// ---- Controls HTML ----
function buildControls(btnType, currentIndex, totalCount) {
    var html = '';
    if (btnType === 'initial') {
        html += '<div class="quizify-example-list__progress">1/' + (totalCount + 1) + '<\/div>';
        html += '<button class="quizify-btn quizify-btn--unknown" type="button" onclick="window.QuizifyNestedReveal.handleUnknown();return false;">不认识<\/button>';
        html += '<button class="quizify-btn quizify-btn--known" type="button" onclick="window.QuizifyNestedReveal.handleKnown();return false;">认识<\/button>';
        html += '<button class="quizify-btn quizify-btn--easy" type="button" onclick="window.QuizifyNestedReveal.handleEasy();return false;">简单<\/button>';
    } else if (btnType === 'revealing') {
        var shown = currentIndex + 1;
        if (shown > totalCount + 1) shown = totalCount + 1;
        html += '<div class="quizify-example-list__progress">' + shown + '/' + (totalCount + 1) + '<\/div>';
        html += '<button class="quizify-btn quizify-btn--unknown" type="button" onclick="window.QuizifyNestedReveal.handleUnknown();return false;">不认识<\/button>';
        html += '<button class="quizify-btn quizify-btn--known" type="button" onclick="window.QuizifyNestedReveal.handleKnown();return false;">认识<\/button>';
        html += '<button class="quizify-btn quizify-btn--easy" type="button" onclick="window.QuizifyNestedReveal.handleEasy();return false;">简单<\/button>';
    } else if (btnType === 'easy_confirm') {
        html += '<button class="quizify-btn quizify-btn--confirm-easy" type="button" onclick="window.QuizifyNestedReveal.handleEasy();return false;">确认简单<\/button>';
    }
    document.querySelector('.quizify-example-list__controls').innerHTML = html;
}

// ---- Reveal logic ----
function revealNext() {
    if (__state.currentIndex >= __state.totalCount) return;
    var items = document.querySelectorAll('.quizify-example-list__item');
    if (__state.currentIndex < items.length) {
        var item = items[__state.currentIndex];
        item.classList.remove('quizify-example-list__item--hidden');
        requestAnimationFrame(function() { item.classList.add('quizify-example-list__item--visible'); });
    }
    __state.currentIndex++;
}

function revealAll() {
    var items = document.querySelectorAll('.quizify-example-list__item');
    for (var k = 0; k < items.length; k++) {
        if (items[k].classList.contains('quizify-example-list__item--hidden')) {
            items[k].classList.remove('quizify-example-list__item--hidden');
            requestAnimationFrame((function(idx) {
                return function() { items[idx].classList.add('quizify-example-list__item--visible'); };
            })(k));
        }
    }
    __state.currentIndex = __state.totalCount;
}

function commitEase(ease) {
    window.__quizifyEase = ease;
    __state.phase = 'done';
    window.__showAnswer();
}

// ---- Button handlers ----
function handleKnown() {
    if (__state.phase === 'initial') {
        __state.phase = 'revealing';
        revealNext();
        buildControls('revealing', __state.currentIndex, __state.totalCount);
        return;
    }
    if (__state.phase === 'revealing') {
        if (__state.currentIndex >= __state.totalCount) { commitEase(3); return; }
        revealNext();
        buildControls('revealing', __state.currentIndex, __state.totalCount);
    }
}

function handleUnknown() {
    var known = __state.currentIndex;
    if (__state.phase === 'revealing' && known > 0) known = known - 1;
    window.__quizifyRevealState = known + ':' + __state.totalCount;
    __state.phase = 'done';
    window.__showAnswer();
}

function handleEasy() {
    if (__state.phase === 'initial' || __state.phase === 'revealing') {
        __state.phase = 'easy_confirm';
        revealAll();
        buildControls('easy_confirm', 0, 0);
    } else if (__state.phase === 'easy_confirm') {
        commitEase(4);
    }
}

function playItemAudio(el) {
    var a = el.querySelector('audio');
    if (a) { a.pause(); a.currentTime = 0; a.play(); }
}

function handleKey(key) {
    if (__state.phase === 'done' || __state.totalCount === 0) return false;
    switch (key) {
        case '1': handleUnknown(); return true;
        case '2': handleKnown(); return true;
        case '3': handleEasy(); return true;
        default: return false;
    }
}

function isActive() {
    return __state.totalCount > 0 && __state.phase !== 'done';
}

// ---- Init ----
export function frontInit() {
    window.__quizifyLog('NESTED', 'init called');
    var rawEl = document.querySelector('.quizify-example-list__raw');
    if (!rawEl) { window.__quizifyLog('NESTED', 'no rawEl'); return; }
    var examples = parseExamples(rawEl.innerHTML);
    __state.phase = 'initial';
    __state.currentIndex = 0;
    __state.examples = examples;
    __state.totalCount = examples.length;
    window.__quizifyLog('NESTED', 'parsed ' + __state.totalCount);
    if (__state.totalCount === 0) return;
    document.querySelector('.quizify-example-list__items').innerHTML = renderAllItems();
    buildControls('initial', 0, __state.totalCount);
    window.__quizifyLog('NESTED', 'controls done');
}

// ---- Publish module ----
window.QuizifyNestedReveal = {
    init: frontInit,
    handleKey: handleKey,
    isActive: isActive,
    handleKnown: handleKnown,
    handleUnknown: handleUnknown,
    handleEasy: handleEasy,
    playItemAudio: playItemAudio
};
