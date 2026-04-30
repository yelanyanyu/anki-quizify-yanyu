/* Quizify Nested Reveal — external JS to avoid Qt WebEngine script block bugs */
(function() {
    'use strict';

    // =========================================================================
    // Debug logger (writes to #quizify-status if present)
    // =========================================================================
    window.__quizifyLog = function(tag, msg) {
        var el = document.getElementById('quizify-status');
        if (el) el.textContent = (el.textContent || '') + ' [' + tag + '] ' + msg;
    };
    __quizifyLog('JS', 'loaded');

    // =========================================================================
    // Audio parsing — strip [sound:...] Anki TTS wrapper
    // =========================================================================
    function parseAudio(rawAudio) {
        var a = rawAudio;
        // [sound:file.mp3] in editor → [anki:play:q:N] after Anki rendering; no filename available
        if (a.indexOf('[anki:play:') === 0) return null;
        // Strip [sound:...] if still present (non-review contexts like test.html)
        if (a.indexOf('[sound:') === 0 && a.lastIndexOf(']') === a.length - 1) a = a.slice(7, -1);
        return a;
    }

    // =========================================================================
    // Parse ExampleList field content
    // =========================================================================
    function parseExamples(raw) {
        if (!raw) return [];
        var parts = raw.split(/\|\|/g);
        return parts.filter(function(s) { return s.trim(); }).map(function(line) {
            var idx = line.indexOf('::');
            if (idx > -1) {
                return {
                    text: line.substring(0, idx).trim(),
                    audio: parseAudio(line.substring(idx + 2).trim())
                };
            }
            return { text: line.trim(), audio: null };
        });
    }

    // =========================================================================
    // Shared state
    // =========================================================================
    var state = { phase: 'initial', currentIndex: 0, examples: [], totalCount: 0 };

    // =========================================================================
    // Front-side: build example item HTML via DOM API
    // =========================================================================
    function buildItemHTML(item, i) {
        var div = document.createElement('div');
        div.className = 'quizify-example-list__item quizify-example-list__item--hidden';
        div.setAttribute('data-index', i);
        div.setAttribute('onclick', 'window.QuizifyNestedReveal.playItemAudio(this);return false;');
        var indicator = document.createElement('span');
        if (item.audio) {
            indicator.className = 'quizify-audio-indicator quizify-audio-indicator--available';
            indicator.textContent = '▶'; // ▶
            var audio = document.createElement('audio');
            audio.src = item.audio;
            audio.preload = 'none';
            audio.style.display = 'none';
            div.appendChild(indicator);
            div.appendChild(audio);
        } else {
            indicator.className = 'quizify-audio-indicator quizify-audio-indicator--muted';
            indicator.textContent = '⊘'; // ⊘
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
        for (var j = 0; j < state.totalCount; j++) h += buildItemHTML(state.examples[j], j);
        return h;
    }

    // =========================================================================
    // Front-side: build controls HTML
    // =========================================================================
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

    // =========================================================================
    // Front-side: reveal logic
    // =========================================================================
    function revealNext() {
        if (state.currentIndex >= state.totalCount) return;
        var items = document.querySelectorAll('.quizify-example-list__item');
        if (state.currentIndex < items.length) {
            var item = items[state.currentIndex];
            item.classList.remove('quizify-example-list__item--hidden');
            requestAnimationFrame(function() { item.classList.add('quizify-example-list__item--visible'); });
        }
        state.currentIndex++;
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
        state.currentIndex = state.totalCount;
    }

    function commitEase(ease) {
        window.__quizifyEase = ease;
        if (typeof pycmd === 'function') {
            state.phase = 'done';
            pycmd('ans');
        }
    }

    // =========================================================================
    // Front-side: button handlers
    // =========================================================================
    function handleKnown() {
        if (state.phase === 'initial') {
            state.phase = 'revealing';
            revealNext();
            buildControls('revealing', state.currentIndex, state.totalCount);
            return;
        }
        if (state.phase === 'revealing') {
            if (state.currentIndex >= state.totalCount) { commitEase(3); return; }
            revealNext();
            buildControls('revealing', state.currentIndex, state.totalCount);
        }
    }

    function handleUnknown() {
        var known = state.currentIndex;
        if (state.phase === 'revealing' && known > 0) known = known - 1;
        window.__quizifyRevealState = known + ':' + state.totalCount;
        if (typeof pycmd === 'function') {
            state.phase = 'done';
            pycmd('ans');
        }
    }

    function handleEasy() {
        if (state.phase === 'initial' || state.phase === 'revealing') {
            state.phase = 'easy_confirm';
            revealAll();
            buildControls('easy_confirm', 0, 0);
        } else if (state.phase === 'easy_confirm') {
            commitEase(4);
        }
    }

    function playItemAudio(el) {
        var a = el.querySelector('audio');
        if (a) { a.pause(); a.currentTime = 0; a.play(); }
    }

    function handleKey(key) {
        if (state.phase === 'done' || state.totalCount === 0) return false;
        switch (key) {
            case '1': handleUnknown(); return true;
            case '2': handleKnown(); return true;
            case '3': handleEasy(); return true;
            default: return false;
        }
    }

    function isActive() {
        return state.totalCount > 0 && state.phase !== 'done';
    }

    // =========================================================================
    // Front-side: init
    // =========================================================================
    function frontInit() {
        __quizifyLog('NESTED', 'init called');
        var rawEl = document.querySelector('.quizify-example-list__raw');
        if (!rawEl) { __quizifyLog('NESTED', 'no rawEl'); return; }
        var rawHTML = rawEl.innerHTML;
        __quizifyLog('RAW', rawHTML.substring(0, 200));
        var examples = parseExamples(rawHTML);
        state.phase = 'initial';
        state.currentIndex = 0;
        state.examples = examples;
        state.totalCount = examples.length;
        __quizifyLog('NESTED', 'parsed ' + state.totalCount);
        if (state.totalCount === 0) return;
        document.querySelector('.quizify-example-list__items').innerHTML = renderAllItems();
        buildControls('initial', 0, state.totalCount);
        __quizifyLog('NESTED', 'controls done');
    }

    // =========================================================================
    // Publish module
    // =========================================================================
    window.QuizifyNestedReveal = {
        init: frontInit,
        handleKey: handleKey,
        isActive: isActive,
        handleKnown: handleKnown,
        handleUnknown: handleUnknown,
        handleEasy: handleEasy,
        playItemAudio: playItemAudio
    };

    // =========================================================================
    // Back-side: auto-rating bridge
    // =========================================================================
    (function() {
        var ease = window.__quizifyEase;
        if (ease) {
            delete window.__quizifyEase;
            if (typeof pycmd === 'function') {
                setTimeout(function() { pycmd('ease' + ease); }, 0);
            }
        }
    })();

    // =========================================================================
    // Back-side: example list rendering
    // =========================================================================
    (function() {
        var rawEl = document.querySelector('.quizify-example-list .quizify-example-list__raw');
        if (!rawEl) return;
        var raw = rawEl.innerHTML;
        if (!raw || !raw.trim()) return;
        var examples = parseExamples(raw);
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
            itemsEl.appendChild(item);
        }
    })();

    // =========================================================================
    // Auto-init on front side
    // =========================================================================
    if (document.querySelector('.quizify-example-list__raw') && document.querySelector('.quizify-example-list__controls')) {
        frontInit();
    }
})();
