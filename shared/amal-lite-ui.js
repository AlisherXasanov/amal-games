/**
 * Без большого куба — только маленькая кнопка ⚡ Силы в играх.
 */
(function (win) {
  "use strict";
  win.__AMAL_HIDE_CUBE__ = true;
  try {
    document.documentElement.classList.add("amal-lite-ui");
  } catch (_) {}

  if (!document.getElementById("amal-lite-ui-css")) {
    var st = document.createElement("style");
    st.id = "amal-lite-ui-css";
    st.textContent =
      "#amal-cube-btn,#amal-cube-pickup,#amal-cube-activate,#amal-cube-dash," +
      "#amal-cube-dash-backdrop{display:none!important;visibility:hidden!important}" +
      "body.amal-lite-ui .side-cube{display:none!important}" +
      "body.amal-lite-ui #amal-powers-fab{display:block!important}" +
      "body.amal-lite-ui #amal-powers-panel.open{display:block!important}" +
      "body.amal-friend-powers #amal-powers-fab{background:linear-gradient(135deg,#c4b5fd,#a855f7)!important;color:#fff!important}";
    (document.head || document.documentElement).appendChild(st);
  }
})(typeof window !== "undefined" ? window : globalThis);
