/**
 * Личный режим владельца Amal Games — ТОЛЬКО для тебя.
 * Гости сайта читы не получают.
 *
 * Включить:
 *   AmalOwner.unlock("AmalOwner2026")
 *   или в адресе: ?owner=AmalOwner2026
 * Выключить: AmalOwner.lock()
 *
 * Клавиши OWNER больше не работают (слишком легко подсмотреть).
 */
(function (global) {
  "use strict";

  const STORAGE_KEY = "amal-owner-v1";
  const SECRET = "AmalOwner2026";

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
      if (code) unlock(code);
    } catch (_) {
      /* ignore */
    }
  }

  tryUrlUnlock();

  global.AmalOwner = {
    isOwner,
    unlock,
    lock,
    SECRET_HINT: "AmalOwner.unlock('AmalOwner2026') или ?owner=AmalOwner2026",
  };
})(typeof window !== "undefined" ? window : globalThis);
