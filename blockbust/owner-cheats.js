/**
 * Личный режим владельца Amal Games — ТОЛЬКО для тебя.
 * Гости сайта читы не получают.
 *
 * Включить:
 *   AmalOwner.unlock("AmalOwner2026")
 *   или в адресе: ?owner=AmalOwner2026
 * Выключить: AmalOwner.lock()
 */
(function (global) {
  "use strict";

  const STORAGE_KEY = "amal-owner-v1";
  const SECRET = "AmalOwner2026";
  let memoryOwner = false;

  function readStorage() {
    try {
      return global.localStorage.getItem(STORAGE_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function writeStorage(on) {
    try {
      if (on) global.localStorage.setItem(STORAGE_KEY, "1");
      else global.localStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      /* ignore — память сессии всё равно держит режим */
    }
  }

  function isOwner() {
    if (memoryOwner) return true;
    if (global.__AMAL_OWNER__ === true) return true;
    return readStorage();
  }

  function unlock(code) {
    if (String(code || "") !== SECRET) {
      console.warn("[AmalOwner] Неверный код");
      return false;
    }
    memoryOwner = true;
    global.__AMAL_OWNER__ = true;
    writeStorage(true);
    console.info("[AmalOwner] Режим владельца ВКЛ");
    global.dispatchEvent(new CustomEvent("amal-owner-changed", { detail: true }));
    return true;
  }

  function lock() {
    memoryOwner = false;
    global.__AMAL_OWNER__ = false;
    writeStorage(false);
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
