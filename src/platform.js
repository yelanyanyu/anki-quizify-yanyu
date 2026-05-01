/* platform.js — Anki Desktop/AnkiDroid abstraction + logger + debug toggle */

// Platform-agnostic card actions
// Desktop: pycmd('ans') / pycmd('easeN')
// AnkiDroid: showAnswer() flips card, auto-rating disabled (user rates manually)
window.__showAnswer = function() {
    if (typeof pycmd === 'function') { pycmd('ans'); }
    else if (typeof showAnswer === 'function') { showAnswer(); }
};
window.__rateCard = function(ease) {
    if (typeof pycmd === 'function') { pycmd('ease' + ease); }
};

// Debug logger (writes to #quizify-status if present)
window.__quizifyLog = function(tag, msg) {
    var el = document.getElementById('quizify-status');
    if (el) el.textContent = (el.textContent || '') + ' [' + tag + '] ' + msg;
};
window.__quizifyToggleDebug = function(on) {
    var el = document.getElementById('quizify-status');
    if (el) el.style.display = on ? 'block' : 'none';
    window.__quizifyDebug = on;
    var cb = document.getElementById('quizify-debug-toggle');
    if (cb) cb.checked = on;
};
if (window.__quizifyDebug) {
    (function() {
        var el = document.getElementById('quizify-status');
        if (el) el.style.display = 'block';
        var cb = document.getElementById('quizify-debug-toggle');
        if (cb) cb.checked = true;
    })();
}
window.__quizifyLog('JS', 'loaded');
