/**
 * Ушастик — слушает до «Стоп», отвечает голосом.
 * Писать текстом можно всегда. UI-языки — отдельно (кнопки).
 */
window.Ushastik = (() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const SPEECH_LANG = "ru-RU";

  const REPLIES = {
    greet: [
      "Привет! Скажи или напиши, что включить — например «маленькая площадка» — и я сразу запущу.",
      "Слушаю! Сказал идею — сразу включаю игру. Можно писать текстом.",
    ],
    russianOnly: [
      "Хорошо, отвечаю по-русски. Скажи идею — сразу включу.",
      "Договорились. Напиши или скажи — и я сразу запущу.",
    ],
    listening: "Говори сейчас… Замолчишь — сам выключу и включу игру. Или нажми Стоп.",
    stoppedEmpty: "Не расслышал. Нажми микрофон и скажи ещё раз чётко.",
    animHelp: [
      "Открываю аниматор — рисуй кадры.",
      "Сейчас открою аниматор.",
    ],
    gameHelp: [
      "Скажи чётко название: баскетбол, площадка, змейка, футбол… — сразу включу.",
      "Просто скажи, какую игру хочешь — без кнопок.",
    ],
    unknown: [
      "Скажи чётче название игры: баскетбол, площадка, змейка…",
      "Напиши или скажи идею — например: баскетбол.",
    ],
  };

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function create(opts = {}) {
    const buddy = opts.buddyEl || document.getElementById("ai-buddy");
    const statusEl = opts.statusEl || document.getElementById("ai-status-text");
    const logEl = opts.logEl || document.getElementById("chat-log");
    const micBtn = opts.micBtn || document.getElementById("btn-mic");
    const micLabel = opts.micLabelEl || document.getElementById("mic-label");
    const onCommand = opts.onCommand || (() => {});
    const onListeningChange = opts.onListeningChange || (() => {});

    let recognition = null;
    let listening = false;
    let speaking = false;
    let wantListen = false;
    let finalText = "";
    let interimText = "";
    let restartTimer = null;
    let silenceTimer = null;
    let maxTimer = null;
    let sessionId = 0;
    let failCount = 0;
    let restartCount = 0;
    const SILENCE_MS = 1200;
    const MAX_LISTEN_MS = 10000; // максимум 10 сек — потом сам выключится
    const MAX_RESTARTS = 2;

    function setMicLabel(listeningNow) {
      const start = (micLabel && micLabel.dataset.labelStart) || "Сказать";
      const stop = (micLabel && micLabel.dataset.labelStop) || "СТОП";
      if (micLabel) {
        micLabel.classList.toggle("is-stop", !!listeningNow);
        micLabel.textContent = listeningNow
          ? "Слушаю… Нажми зелёную кнопку «СТОП», чтобы выключить."
          : "Оранжевая кнопка = сказать. Когда слушаю — станет зелёной «СТОП»: нажми, чтобы выключить.";
      }
      if (micBtn) {
        micBtn.classList.toggle("is-listening", !!listeningNow);
        micBtn.innerHTML = listeningNow
          ? `<span class="mic-ico">⏹</span><span class="mic-txt">${stop}</span>`
          : `<span class="mic-ico">🎤</span><span class="mic-txt">${start}</span>`;
        micBtn.title = listeningNow ? stop : start;
        micBtn.setAttribute("aria-label", listeningNow ? stop : start);
      }
    }

    function setState(state) {
      if (buddy) {
        buddy.classList.toggle("is-listening", state === "listening");
        buddy.classList.toggle("is-talking", state === "talking");
      }
      if (micBtn) micBtn.setAttribute("aria-pressed", state === "listening" ? "true" : "false");
      setMicLabel(state === "listening");
      onListeningChange(state === "listening");
    }

    function setStatus(text) {
      if (statusEl) statusEl.textContent = text;
    }

    function addBubble(role, text) {
      if (!logEl) return;
      const div = document.createElement("div");
      div.className = `bubble ${role}`;
      div.textContent = text;
      logEl.appendChild(div);
      logEl.scrollTop = logEl.scrollHeight;
    }

    function stopTalk() {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      speaking = false;
      if (!listening) setState("idle");
    }

    function pickRussianVoice() {
      const voices = speechSynthesis.getVoices() || [];
      const ru = voices.filter((v) => /^ru\b/i.test(v.lang) || /russ/i.test(v.name));
      const prefer = ru.find((v) => /ирина|milena|elena|oksana|female|google.*рус/i.test(v.name));
      return prefer || ru[0] || null;
    }

    function speak(text, { silentLog } = {}) {
      if (!text) return;
      if (!silentLog) addBubble("ai", text);
      setStatus(text);
      if (!("speechSynthesis" in window)) return;

      stopTalk();
      speaking = true;
      if (!listening) setState("talking");

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = SPEECH_LANG;
      utter.rate = 1.02;
      utter.pitch = 1.05;
      const ru = pickRussianVoice();
      if (ru) {
        utter.voice = ru;
        utter.lang = ru.lang || SPEECH_LANG;
      }
      utter.onend = () => {
        speaking = false;
        setState(listening ? "listening" : "idle");
      };
      utter.onerror = () => {
        speaking = false;
        setState(listening ? "listening" : "idle");
      };
      speechSynthesis.speak(utter);
    }

    function interpret(raw) {
      const t = String(raw || "").toLowerCase().trim();
      if (!t) return { type: "empty", reply: REPLIES.stoppedEmpty };

      if (/по[- ]?русск|на русском|говори русск|только русск|russian/.test(t)) {
        return { type: "russian", reply: pick(REPLIES.russianOnly) };
      }
      if (/прив|здравст|хай|hello|hi\b/.test(t)) {
        return { type: "greet", reply: pick(REPLIES.greet) };
      }
      if (/анимац|кадр|нарис|мульт|ожив|animat/.test(t)) {
        return { type: "anim", reply: "Включаю аниматор!", go: "animate.html" };
      }
      if (/что уме|какие игр|что зна|список игр|help|помог/.test(t)) {
        const hints = window.CreateLabCatalog ? CreateLabCatalog.listHints() : "площадка, баскетбол, змейка";
        return {
          type: "help",
          reply: `Я знаю много игр: ${hints}. Ещё могу открыть Melon Playground, зомби, Kick Buddy и другие из каталога. Скажи название — сразу включу.`,
        };
      }
      if (/площадк|playground|песочниц|баскет|basket|футбол|soccer|дыня|melon|игр|змей|прыг|гонка|лови|сделай|создай|включи|открой|зомби|прятк|стрел|тир|game|snake|jump|race|catch|хочу|кольц/.test(t)) {
        const made = window.CreateLabStore && CreateLabStore.makeGameFromIdea(raw);
        if (made && made.href) {
          return {
            type: "game",
            reply: `Открываю настоящую игру «${made.name}»!`,
            go: made.href,
            instant: true,
          };
        }
        if (made && made.game) {
          return {
            type: "game",
            reply: `Включаю «${made.kindRu}» — ${made.game.name}!`,
            go: `play.html?id=${encodeURIComponent(made.game.id)}`,
            draft: made.game,
            instant: true,
          };
        }
        return {
          type: "game",
          reply: "Открываю мастер игр.",
          go: "game.html",
        };
      }
      if (/ушк/.test(t)) {
        return {
          type: "help",
          reply: "Скажи или напиши идею — сразу включу. Например: баскетбол, маленькая площадка, змейка.",
        };
      }
      return {
        type: "chat",
        reply: `Я понял: «${raw.trim()}». ${pick(REPLIES.unknown)}`,
      };
    }

    function handleTranscript(text) {
      const cleaned = String(text || "").trim();
      if (!cleaned) {
        setStatus(REPLIES.stoppedEmpty);
        addBubble("ai", REPLIES.stoppedEmpty);
        return;
      }
      addBubble("user", cleaned);
      const result = interpret(cleaned);
      speak(result.reply);
      onCommand(result);
      if (result.go && opts.autoNavigate !== false) {
        if (result.draft && !result.instant) {
          sessionStorage.setItem("create-lab-draft", JSON.stringify(result.draft));
        }
        const delay = result.instant ? 700 : 1200;
        setTimeout(() => {
          location.href = result.go;
        }, delay);
      }
    }

    function clearRestart() {
      if (restartTimer) {
        clearTimeout(restartTimer);
        restartTimer = null;
      }
    }

    function clearSilence() {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
    }

    function clearMax() {
      if (maxTimer) {
        clearTimeout(maxTimer);
        maxTimer = null;
      }
    }

    function clearAllTimers() {
      clearRestart();
      clearSilence();
      clearMax();
    }

    function armSilence(sid) {
      clearSilence();
      silenceTimer = setTimeout(() => {
        if (sid !== sessionId || !wantListen) return;
        const text = (finalText + " " + interimText).replace(/\s+/g, " ").trim();
        if (text) {
          setStatus(`Понял: ${text}`);
          finishListening(true);
        }
      }, SILENCE_MS);
    }

    function finishListening(processText) {
      clearAllTimers();
      wantListen = false;
      listening = false;
      const text = (finalText + " " + interimText).replace(/\s+/g, " ").trim();
      finalText = "";
      interimText = "";
      sessionId += 1;
      try { recognition?.abort?.(); } catch (_) {}
      try { recognition?.stop?.(); } catch (_) {}
      recognition = null;
      setState(speaking ? "talking" : "idle");

      if (processText) {
        if (text) handleTranscript(text);
        else {
          setStatus(REPLIES.stoppedEmpty);
          addBubble("ai", REPLIES.stoppedEmpty);
        }
      } else {
        setStatus("Микрофон выключен. Нажми снова и скажи идею.");
      }
    }

    function bindRecognition(rec, sid) {
      rec.lang = SPEECH_LANG;
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;

      rec.onresult = (event) => {
        if (sid !== sessionId || !wantListen) return;
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalText += (finalText ? " " : "") + chunk;
          else interim += chunk;
        }
        interimText = interim;
        const live = (finalText + " " + interim).replace(/\s+/g, " ").trim();
        if (live) {
          setStatus(`Слышу: ${live}`);
          armSilence(sid);
        } else setStatus(REPLIES.listening);
      };

      rec.onerror = (event) => {
        if (sid !== sessionId) return;
        const err = event.error;
        if (err === "aborted") return;
        if (err === "not-allowed" || err === "service-not-allowed") {
          finishListening(false);
          speak("Нужно разрешить микрофон. Пока можно писать текстом.");
          return;
        }
        if (err === "no-speech") {
          finishListening(false);
          setStatus("Тишина. Нажми микрофон и скажи ещё раз.");
          return;
        }
        finishListening(false);
        setStatus("Микрофон сбился. Напиши текстом — так надёжнее.");
        addBubble("ai", "Микрофон сбился. Напиши текстом — так надёжнее.");
      };

      rec.onend = () => {
        if (sid !== sessionId) return;
        if (!wantListen) {
          listening = false;
          return;
        }
        const text = (finalText + " " + interimText).replace(/\s+/g, " ").trim();
        if (text) {
          finishListening(true);
          return;
        }
        restartCount += 1;
        if (restartCount > MAX_RESTARTS) {
          finishListening(false);
          setStatus("Не расслышал. Нажми микрофон и скажи чётко.");
          return;
        }
        clearRestart();
        restartTimer = setTimeout(() => {
          if (!wantListen || sid !== sessionId) return;
          try {
            const next = new SpeechRecognition();
            recognition = next;
            bindRecognition(next, sid);
            next.start();
            listening = true;
            setState("listening");
            setStatus(REPLIES.listening);
          } catch (_) {
            finishListening(false);
          }
        }, 200);
      };
    }

    function startListen() {
      if (!SpeechRecognition) {
        speak("В этом браузере нет распознавания речи. Пиши текстом.");
        return;
      }
      stopTalk();
      clearAllTimers();
      sessionId += 1;
      const sid = sessionId;
      finalText = "";
      interimText = "";
      failCount = 0;
      restartCount = 0;
      wantListen = true;
      listening = true;

      recognition = new SpeechRecognition();
      bindRecognition(recognition, sid);
      setState("listening");
      setStatus(REPLIES.listening);

      maxTimer = setTimeout(() => {
        if (sid !== sessionId || !wantListen) return;
        const text = (finalText + " " + interimText).replace(/\s+/g, " ").trim();
        finishListening(!!text);
        if (!text) setStatus("Время вышло. Нажми микрофон и скажи короче.");
      }, MAX_LISTEN_MS);

      try {
        recognition.start();
      } catch (_) {
        finishListening(false);
        speak("Не удалось включить микрофон. Пиши текстом.");
      }
    }

    function stopListen(processText = true) {
      finishListening(processText);
    }

    function toggleMic() {
      if (wantListen || listening) finishListening(true);
      else startListen();
    }

    if (micBtn) {
      micBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMic();
      });
    }

    if ("speechSynthesis" in window) {
      speechSynthesis.getVoices();
      speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
    }

    setMicLabel(false);

    return {
      speak,
      startListen,
      stopListen,
      toggleMic,
      interpret,
      handleTranscript,
      greet() {
        speak(pick(REPLIES.greet));
      },
    };
  }

  return { create };
})();
