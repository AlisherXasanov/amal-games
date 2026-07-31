/**
 * Личный режим владельца Amal Games.
 * Включается ТОЛЬКО на твоём устройстве секретным кодом — гости сайта его не получают.
 *
 * Включить:
 *   1) В консоли: AmalOwner.unlock("AmalOwner2026")
 *   2) Или в адресной строке: ?owner=AmalOwner2026
 *   3) Или нажми O-W-N-E-R подряд на меню
 * Выключить: AmalOwner.lock()
 */
(function (global) {
  "use strict";

  const STORAGE_KEY = "amal-owner-v1";
  const SECRET = "AmalOwner2026";
  let buffer = "";

  function isOwner() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function unlock(code) {
    if (String(code || "") !== SECRET) {
      console.warn("[AmalOwner] Неверный код");
      return false;
    }
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch (_) {
      /* ignore */
    }
    console.info("[AmalOwner] Режим владельца ВКЛ");
    global.dispatchEvent(new CustomEvent("amal-owner-changed", { detail: true }));
    return true;
  }

  function lock() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      /* ignore */
    }
    console.info("[AmalOwner] Режим владельца ВЫКЛ");
    global.dispatchEvent(new CustomEvent("amal-owner-changed", { detail: false }));
  }

  function tryUrlUnlock() {
    try {
      const params = new URLSearchParams(global.location.search);
      const code = params.get("owner");
      if (!code) return;
      if (unlock(code)) {
        // Clean URL so the secret is not left in the address bar
        try {
          const clean = global.location.pathname + global.location.hash;
          global.history.replaceState({}, "", clean);
        } catch (_) {
          /* ignore */
        }
        alert("Личный режим включён на этом устройстве.\nВсе бойцы, монеты и кнопка «Читы» — только у тебя.");
      } else {
        alert("Неверный код владельца");
      }
    } catch (_) {
      /* ignore */
    }
  }

  function onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const key = String(e.key || "").toLowerCase();
    if (key.length !== 1) return;
    buffer = (buffer + key).slice(-5);
    if (buffer === "owner") {
      buffer = "";
      if (isOwner()) {
        lock();
        alert("Режим владельца выключен");
      } else if (unlock(SECRET)) {
        alert("Режим владельца включён: бесконечные ресурсы и читы");
      }
    }
  }

  tryUrlUnlock();
  global.addEventListener("keydown", onKey);

  global.AmalOwner = {
    isOwner,
    unlock,
    lock,
    SECRET_HINT: "Введи OWNER на клавиатуре или AmalOwner.unlock('…')",
  };
})(typeof window !== "undefined" ? window : globalThis);
