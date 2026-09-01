/**
 * Совместимость: amal-phone-back → amal-hub-back
 */
(function () {
  "use strict";
  var s = document.createElement("script");
  s.src = (function () {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || "";
      if (src.indexOf("amal-phone-back.js") >= 0) {
        return src.replace("amal-phone-back.js", "amal-hub-back.js?v=1");
      }
    }
    return "../shared/amal-hub-back.js?v=1";
  })();
  document.head.appendChild(s);
})();
