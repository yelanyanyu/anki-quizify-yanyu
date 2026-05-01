/* Quizify Nested Reveal — auto-built by esbuild */
(function() {
  // src/platform.js
  window.__showAnswer = function() {
    if (typeof pycmd === "function") {
      pycmd("ans");
    } else if (typeof showAnswer === "function") {
      showAnswer();
    }
  };
  window.__rateCard = function(ease) {
    if (typeof pycmd === "function") {
      pycmd("ease" + ease);
    }
  };
  window.__quizifyLog = function(tag, msg) {
    var el = document.getElementById("quizify-status");
    if (el) el.textContent = (el.textContent || "") + " [" + tag + "] " + msg;
  };
  window.__quizifyToggleDebug = function(on) {
    var el = document.getElementById("quizify-status");
    if (el) el.style.display = on ? "block" : "none";
    window.__quizifyDebug = on;
    var cb = document.getElementById("quizify-debug-toggle");
    if (cb) cb.checked = on;
  };
  if (window.__quizifyDebug) {
    (function() {
      var el = document.getElementById("quizify-status");
      if (el) el.style.display = "block";
      var cb = document.getElementById("quizify-debug-toggle");
      if (cb) cb.checked = true;
    })();
  }
  window.__quizifyLog("JS", "loaded");

  // src/parse.js
  function parseAudio(rawAudio) {
    var a = rawAudio;
    if (a.indexOf("[anki:play:") === 0) return null;
    if (a.indexOf("[sound:") === 0 && a.lastIndexOf("]") === a.length - 1) a = a.slice(7, -1);
    return a;
  }
  function parseTranslation(raw) {
    if (!raw) return [];
    return raw.split(/\|\|/g).map(function(s) {
      return s.trim();
    });
  }
  function parseExamples(raw) {
    if (!raw) return [];
    var parts = raw.split(/\|\|/g);
    return parts.filter(function(s) {
      return s.trim();
    }).map(function(line) {
      var idx = line.indexOf("::");
      if (idx > -1) {
        return {
          text: line.substring(0, idx).trim(),
          audio: parseAudio(line.substring(idx + 2).trim())
        };
      }
      return { text: line.trim(), audio: null };
    });
  }

  // src/back.js
  (function() {
    var ease = window.__quizifyEase;
    if (ease) {
      delete window.__quizifyEase;
      setTimeout(function() {
        window.__rateCard(ease);
      }, 0);
    }
  })();
  (function() {
    var rawEl = document.querySelector(".quizify-example-list .quizify-example-list__raw");
    if (!rawEl) return;
    var raw = rawEl.innerHTML;
    if (!raw || !raw.trim()) return;
    var examples = parseExamples(raw);
    var trRawEl = document.querySelector(".quizify-example-translation__raw");
    var translations = trRawEl ? parseTranslation(trRawEl.innerHTML) : [];
    for (var ti = 0; ti < examples.length; ti++) {
      examples[ti].translation = translations[ti] || null;
    }
    if (examples.length === 0) return;
    var knownCount = 0;
    var stateStr = window.__quizifyRevealState;
    if (stateStr) {
      var parts = stateStr.split(":");
      knownCount = parseInt(parts[0]) || 0;
      delete window.__quizifyRevealState;
    }
    var summaryEl = document.querySelector(".quizify-example-list .quizify-example-list__summary");
    if (summaryEl) {
      summaryEl.textContent = "\u8BA4\u8BC6\u4E86 " + knownCount + "/" + examples.length + " \u4E2A\u4F8B\u53E5";
    }
    var itemsEl = document.querySelector(".quizify-example-list .quizify-example-list__items");
    if (!itemsEl) return;
    for (var i = 0; i < examples.length; i++) {
      var item = document.createElement("div");
      item.className = "quizify-example-list__item quizify-example-list__item--visible";
      if (i < knownCount) {
        item.className += " quizify-example-list__item--known";
      } else {
        item.className += " quizify-example-list__item--unrevealed";
      }
      var indicator = document.createElement("span");
      if (examples[i].audio) {
        indicator.className = "quizify-audio-indicator quizify-audio-indicator--available";
        indicator.textContent = "\u25B6";
        var audioEl = document.createElement("audio");
        audioEl.src = examples[i].audio;
        audioEl.preload = "none";
        audioEl.style.display = "none";
        item.appendChild(indicator);
        item.appendChild(audioEl);
        item.addEventListener("click", /* @__PURE__ */ (function(el) {
          return function() {
            var a = el.querySelector("audio");
            if (a) {
              a.pause();
              a.currentTime = 0;
              a.play();
            }
          };
        })(item));
      } else {
        indicator.className = "quizify-audio-indicator quizify-audio-indicator--muted";
        indicator.textContent = "\u2298";
        item.appendChild(indicator);
      }
      var mark = document.createElement("span");
      if (i < knownCount) {
        mark.className = "quizify-example-list__result-mark quizify-example-list__result-mark--known";
        mark.textContent = "\u2713";
      } else {
        mark.className = "quizify-example-list__result-mark quizify-example-list__result-mark--unrevealed";
        mark.textContent = "\u2717";
      }
      item.appendChild(mark);
      var textSpan = document.createElement("span");
      textSpan.className = "quizify-example-list__item-text";
      textSpan.textContent = examples[i].text;
      item.appendChild(textSpan);
      if (examples[i].translation) {
        var trSpan = document.createElement("span");
        trSpan.className = "quizify-example-list__item-translation";
        trSpan.textContent = examples[i].translation;
        item.appendChild(trSpan);
      }
      itemsEl.appendChild(item);
    }
  })();

  // src/front.js
  var __state = { phase: "initial", currentIndex: 0, examples: [], totalCount: 0 };
  function buildItemHTML(item, i) {
    var div = document.createElement("div");
    div.className = "quizify-example-list__item quizify-example-list__item--hidden";
    div.setAttribute("data-index", i);
    div.setAttribute("onclick", "window.QuizifyNestedReveal.playItemAudio(this);return false;");
    var indicator = document.createElement("span");
    if (item.audio) {
      indicator.className = "quizify-audio-indicator quizify-audio-indicator--available";
      indicator.textContent = "\u25B6";
      var audio = document.createElement("audio");
      audio.src = item.audio;
      audio.preload = "none";
      audio.style.display = "none";
      div.appendChild(indicator);
      div.appendChild(audio);
    } else {
      indicator.className = "quizify-audio-indicator quizify-audio-indicator--muted";
      indicator.textContent = "\u2298";
      div.appendChild(indicator);
    }
    var textSpan = document.createElement("span");
    textSpan.className = "quizify-example-list__item-text";
    textSpan.textContent = item.text;
    div.appendChild(textSpan);
    return div.outerHTML;
  }
  function renderAllItems() {
    var h = "";
    for (var j = 0; j < __state.totalCount; j++) h += buildItemHTML(__state.examples[j], j);
    return h;
  }
  function buildControls(btnType, currentIndex, totalCount) {
    var html = "";
    if (btnType === "initial") {
      html += '<div class="quizify-example-list__progress">1/' + (totalCount + 1) + "</div>";
      html += '<button class="quizify-btn quizify-btn--unknown" type="button" onclick="window.QuizifyNestedReveal.handleUnknown();return false;">\u4E0D\u8BA4\u8BC6</button>';
      html += '<button class="quizify-btn quizify-btn--known" type="button" onclick="window.QuizifyNestedReveal.handleKnown();return false;">\u8BA4\u8BC6</button>';
      html += '<button class="quizify-btn quizify-btn--easy" type="button" onclick="window.QuizifyNestedReveal.handleEasy();return false;">\u7B80\u5355</button>';
    } else if (btnType === "revealing") {
      var shown = currentIndex + 1;
      if (shown > totalCount + 1) shown = totalCount + 1;
      html += '<div class="quizify-example-list__progress">' + shown + "/" + (totalCount + 1) + "</div>";
      html += '<button class="quizify-btn quizify-btn--unknown" type="button" onclick="window.QuizifyNestedReveal.handleUnknown();return false;">\u4E0D\u8BA4\u8BC6</button>';
      html += '<button class="quizify-btn quizify-btn--known" type="button" onclick="window.QuizifyNestedReveal.handleKnown();return false;">\u8BA4\u8BC6</button>';
      html += '<button class="quizify-btn quizify-btn--easy" type="button" onclick="window.QuizifyNestedReveal.handleEasy();return false;">\u7B80\u5355</button>';
    } else if (btnType === "easy_confirm") {
      html += '<button class="quizify-btn quizify-btn--confirm-easy" type="button" onclick="window.QuizifyNestedReveal.handleEasy();return false;">\u786E\u8BA4\u7B80\u5355</button>';
    }
    document.querySelector(".quizify-example-list__controls").innerHTML = html;
  }
  function revealNext() {
    if (__state.currentIndex >= __state.totalCount) return;
    var items = document.querySelectorAll(".quizify-example-list__item");
    if (__state.currentIndex < items.length) {
      var item = items[__state.currentIndex];
      item.classList.remove("quizify-example-list__item--hidden");
      requestAnimationFrame(function() {
        item.classList.add("quizify-example-list__item--visible");
      });
    }
    __state.currentIndex++;
  }
  function revealAll() {
    var items = document.querySelectorAll(".quizify-example-list__item");
    for (var k = 0; k < items.length; k++) {
      if (items[k].classList.contains("quizify-example-list__item--hidden")) {
        items[k].classList.remove("quizify-example-list__item--hidden");
        requestAnimationFrame(/* @__PURE__ */ (function(idx) {
          return function() {
            items[idx].classList.add("quizify-example-list__item--visible");
          };
        })(k));
      }
    }
    __state.currentIndex = __state.totalCount;
  }
  function commitEase(ease) {
    window.__quizifyEase = ease;
    __state.phase = "done";
    window.__showAnswer();
  }
  function handleKnown() {
    if (__state.phase === "initial") {
      __state.phase = "revealing";
      revealNext();
      buildControls("revealing", __state.currentIndex, __state.totalCount);
      return;
    }
    if (__state.phase === "revealing") {
      if (__state.currentIndex >= __state.totalCount) {
        commitEase(3);
        return;
      }
      revealNext();
      buildControls("revealing", __state.currentIndex, __state.totalCount);
    }
  }
  function handleUnknown() {
    var known = __state.currentIndex;
    if (__state.phase === "revealing" && known > 0) known = known - 1;
    window.__quizifyRevealState = known + ":" + __state.totalCount;
    __state.phase = "done";
    window.__showAnswer();
  }
  function handleEasy() {
    if (__state.phase === "initial" || __state.phase === "revealing") {
      __state.phase = "easy_confirm";
      revealAll();
      buildControls("easy_confirm", 0, 0);
    } else if (__state.phase === "easy_confirm") {
      commitEase(4);
    }
  }
  function playItemAudio(el) {
    var a = el.querySelector("audio");
    if (a) {
      a.pause();
      a.currentTime = 0;
      a.play();
    }
  }
  function handleKey(key) {
    if (__state.phase === "done" || __state.totalCount === 0) return false;
    switch (key) {
      case "1":
        handleUnknown();
        return true;
      case "2":
        handleKnown();
        return true;
      case "3":
        handleEasy();
        return true;
      default:
        return false;
    }
  }
  function isActive() {
    return __state.totalCount > 0 && __state.phase !== "done";
  }
  function frontInit() {
    window.__quizifyLog("NESTED", "init called");
    var rawEl = document.querySelector(".quizify-example-list__raw");
    if (!rawEl) {
      window.__quizifyLog("NESTED", "no rawEl");
      return;
    }
    var examples = parseExamples(rawEl.innerHTML);
    __state.phase = "initial";
    __state.currentIndex = 0;
    __state.examples = examples;
    __state.totalCount = examples.length;
    window.__quizifyLog("NESTED", "parsed " + __state.totalCount);
    if (__state.totalCount === 0) return;
    document.querySelector(".quizify-example-list__items").innerHTML = renderAllItems();
    buildControls("initial", 0, __state.totalCount);
    window.__quizifyLog("NESTED", "controls done");
  }
  window.QuizifyNestedReveal = {
    init: frontInit,
    handleKey: handleKey,
    isActive: isActive,
    handleKnown: handleKnown,
    handleUnknown: handleUnknown,
    handleEasy: handleEasy,
    playItemAudio: playItemAudio
  };

  // src/index.js
  if (document.querySelector(".quizify-example-list__raw") && document.querySelector(".quizify-example-list__controls")) {
    frontInit();
  }
})();
