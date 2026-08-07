/**
 * Личный режим владельца — ТОЛЬКО ты.
 * Старые коды команды (AmalOwner2026, OWNER, team) больше НЕ работают.
 *
 * Включить (короткие коды):
 *   AmalOwner.unlock("amal")
 *   или: ?owner=amal
 * Также работают: 1234, buddy
 * Выключить: AmalOwner.lock()
 */
(function (global) {
  "use strict";

  const STORAGE_KEY = "amal-owner-v3";
  // bump: force Pages refresh for easy codes
  const SECRETS = ["amal", "1234", "buddy"];
  const OLD_KEYS = ["kick-buddy-admin"];

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

  function normalize(code) {
    return String(code || "").trim().toLowerCase().replace(/[\s,.\-_/]+/g, "");
  }

  function unlock(code) {
    if (!SECRETS.includes(normalize(code))) {
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

  // Клавиши OWNER больше не открывают админку — команда знала этот трюк
  tryUrlUnlock();

  global.AmalOwner = {
    isOwner,
    unlock,
    lock,
    isLocalHost,
    SECRET_HINT: "Короткий код: amal / 1234 / buddy",
  };
})(typeof window !== "undefined" ? window : globalThis);
