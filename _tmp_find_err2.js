const fs = require("fs");
const s = fs.readFileSync(
  "C:/Users/User/zombie-vs-plants/games/terraverse/assets/SandboxGame-BtreeFall1.js",
  "utf8"
);

// Find suspicious patterns near our patch
const hook = s.indexOf("l===4&&(()=>{let e=treeFall");
console.log("hook at", hook);

// Check if `for(let[i,l]of` could be an issue in older browsers - no, Unexpected (

// Look for broken template literals - count backticks
let ticks = 0;
for (const ch of s) if (ch === "`") ticks++;
console.log("backtick count", ticks, "even?", ticks % 2 === 0);

// Find unclosed or weirdness around treeFall key template
const tf = s.indexOf("function treeFall");
console.log("around key fn:", JSON.stringify(s.slice(tf, tf + 80)));

// Search for `,(l===7` context - maybe we broke the if(
const ctxStart = s.lastIndexOf("if(", hook);
console.log("if before hook:", s.slice(ctxStart, hook + 50));

// Compare to an older known-good SandboxGame without our patches
const others = [
  "SandboxGame-CJtDMoN5.js",
  "SandboxGame-DmJN1d3t.js",
  "SandboxGame-0da-jwon.js",
  "SandboxGame-CcbV1VuK.js",
  "SandboxGame-8ySQXf8f.js",
  "SandboxGame-BzU8cDBw.js",
];
for (const name of others) {
  const p =
    "C:/Users/User/zombie-vs-plants/games/terraverse/assets/" + name;
  if (!fs.existsSync(p)) continue;
  const t = fs.readFileSync(p, "utf8");
  console.log(
    name,
    "size",
    t.length,
    "treeFall",
    t.includes("treeFall"),
    "mined+=1,j",
    t.includes("A.current.mined+=1,j.current+=1")
  );
}
