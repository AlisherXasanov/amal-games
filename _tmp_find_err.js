const fs = require("fs");
const path =
  "C:/Users/User/zombie-vs-plants/games/terraverse/assets/SandboxGame-BtreeFall1.js";
const s = fs.readFileSync(path, "utf8");

const noImp = s.replace(/^import\{[^}]+\}from"[^"]+";/, "");
const noExp = noImp.replace(/export\{[^}]+\};?\s*$/, "");

try {
  new Function(noExp);
  console.log("whole body OK");
} catch (e) {
  console.log("ERR", e.message);
}

try {
  const acorn = require("acorn");
  acorn.parse(noExp, { ecmaVersion: 2022 });
  console.log("acorn ok");
} catch (e) {
  console.log("acorn", e.message, "pos", e.pos);
  if (e.pos != null) {
    console.log("---around---");
    console.log(noExp.slice(Math.max(0, e.pos - 100), e.pos + 100));
  }
}

// Also try without treeFall: remove function and hook
let cleaned = noExp;
const start = cleaned.indexOf("function treeFall");
const end = cleaned.indexOf("function _(e)", start);
if (start >= 0 && end >= 0) {
  cleaned = cleaned.slice(0, start) + cleaned.slice(end);
}
cleaned = cleaned.replace(
  /l===4&&\(\(\)=>\{let e=treeFall\(E,n,s\);if\(!e\|\|!e\.length\)return;for\(let t of e\)\{q\.current\|\|t===17\|\|t===20\|\|t===13\|\|\(w\.current\[t\]=\(w\.current\[t\]\?\?0\)\+1\),t===5&&Math\.random\(\)<\.08&&\(O\.current\.apple\+=1,y\.current\.push\(\{x:n\*24,y:s\*24,text:`🍎`,life:1,color:`#ff6666`\}\)\),A\.current\.mined\+=1,j\.current\+=1\}r\(`Дерево упало!`\)\}\)\(\),/g,
  ""
);
try {
  new Function(cleaned);
  console.log("without treeFall OK — bug is in our patch");
} catch (e) {
  console.log("still bad without patch?", e.message);
}

// Check original Budqs without treeFall
const orig = fs.readFileSync(
  "C:/Users/User/zombie-vs-plants/games/terraverse/assets/SandboxGame-BudqsLB0.js",
  "utf8"
);
const o1 = orig.replace(/^import\{[^}]+\}from"[^"]+";/, "");
const o2 = o1.replace(/export\{[^}]+\};?\s*$/, "");
// if orig still has treeFall (we patched in place)
console.log("orig has treeFall", orig.includes("function treeFall"));
try {
  new Function(o2);
  console.log("orig body OK");
} catch (e) {
  console.log("orig ERR", e.message);
}
