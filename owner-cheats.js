/**
 * Личный режим владельца — ТОЛЬКО ты.
 * Старые коды команды (AmalOwner2026, OWNER, team) больше НЕ работают.
 *
 * Включить (только новый секрет):
 *   AmalOwner.unlock("AmalSoloOnly2026")
 *   или один раз: ?owner=AmalSoloOnly2026
 * Выключить: AmalOwner.lock()
 */
(function (global) {
  "use strict";

  const STORAGE_KEY = "amal-owner-v3";
  const SECRET = "AmalSoloOnly2026";
  const OLD_KEYS = ["amal-owner-v1", "amal-owner-v2", "kick-buddy-admin"];

  function wipeOldTeamFlags() {
    try {
      OLD_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch (_) {
      /* ignore */
    }
  }

  wipeOldTeamFlags();

  function isOwner() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function unlock(code) {
    if (String(code || "") !== SECRET) {
      console.warn("[AmalOwner] Неверный код — командный доступ закрыт");
      return false;
    }
    try {
      wipeOldTeamFlags();
      localStorage.setItem(STORAGE_KEY, "1");
    } catch (_) {
      /* ignore */
    }
    console.info("[AmalOwner] Режим владельца ВКЛ (только ты)");
    global.dispatchEvent(new CustomEvent("amal-owner-changed", { detail: true }));
    return true;
  }

  function lock() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      wipeOldTeamFlags();
    } catch (_) {
      /* ignore */
    }
    console.info("[AmalOwner] Режим владельца ВЫКЛ");
    global.dispatchEvent(new CustomEvent("amal-owner-changed", { detail: false }));
  }

  function isLocalHost() {
    try {
      const h = String(global.location && global.location.hostname || "");
      return h === "127.0.0.1" || h === "localhost" || h === "::1";
    } catch (_) {
      return false;
    }
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
    isLocalHost,
    SECRET_HINT: "Только личный секрет владельца (консоль или ?owner=…)",
  };
})(typeof window !== "undefined" ? window : globalThis);
