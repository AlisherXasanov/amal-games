const fs = require("fs");
const s = fs.readFileSync(
  "C:/Users/User/zombie-vs-plants/games/terraverse/assets/SandboxGame-BudqsLB0.js",
  "utf8"
);
const e = fs.readFileSync(
  "C:/Users/User/zombie-vs-plants/games/terraverse/assets/static-index-USimIA2b.js",
  "utf8"
);
const h = fs.readFileSync(
  "C:/Users/User/zombie-vs-plants/games/terraverse/index.html",
  "utf8"
);
console.log("sandbox", s.length, "treeFall", s.includes("function treeFall("));
console.log("apply", s.includes("treeFallApply"));
console.log("hook", s.includes("l===4&&treeFallApply"));
console.log(
  "entry chunk",
  (e.match(/SandboxGame-[A-Za-z0-9_-]+\.js/) || [])[0]
);
console.log("entry has query", /\?v=/.test(e.match(/SandboxGame[^`']+/)?.[0] || ""));
console.log("index script", (h.match(/static-index[^"']+/) || [])[0]);

// syntax check via Function after stubbing import
const body = s
  .replace(/^import\{[^}]+\}from"[^"]+";/, "var e={useRef:()=>({current:null}),useState:()=>[0,()=>{}],useEffect:()=>{},useCallback:f=>f};var t=m=>m;var n=()=>({});")
  .replace(/export\{[^}]+\};?\s*$/, "");
try {
  new Function(body);
  console.log("Function parse: OK");
} catch (err) {
  console.log("Function parse FAIL:", err.message);
}
