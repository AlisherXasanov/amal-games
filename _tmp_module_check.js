const fs = require("fs");
const { spawnSync } = require("child_process");
const node = "C:/Users/User/zombie-vs-plants/.tools/node/node.exe";

const good = fs
  .readFileSync(
    "C:/Users/User/zombie-vs-plants/games/terraverse/assets/SandboxGame-BudqsLB0.js"
  )
  .toString("utf8");

// Compare: checkout clean without patch into temp and test browser-like module check
// Use node's --experimental-default-type=module with a stub package

const harness = "C:/Users/User/zombie-vs-plants/games/_parse_harness";
fs.mkdirSync(harness, { recursive: true });
fs.writeFileSync(
  harness + "/static-index-USimIA2b.js",
  `export function n(){return{useRef:()=>({current:null}),useState:()=>[null,()=>{}],useEffect:()=>{},useCallback:f=>f,createElement:()=>null,Fragment:"f"};}
export const r=m=>m;
export const t=()=>({jsx:()=>null,jsxs:()=>null,Fragment:"F"});
`
);

function moduleCheck(label, src) {
  fs.writeFileSync(harness + "/game.mjs", src);
  const r = spawnSync(node, ["--check", harness + "/game.mjs"], {
    encoding: "utf8",
  });
  console.log(label, "status", r.status);
  if (r.stderr) {
    const msg = r.stderr.split("\n").slice(0, 6).join("\n");
    console.log(msg);
  }
  return r.status === 0;
}

// current patched
moduleCheck("patched", good);

// unpatched from git object via reading BtreeFall removed - extract treeFall out
let unpatched = good;
const a = unpatched.indexOf("function treeFall(");
const b = unpatched.indexOf("function _(e)", a);
if (a >= 0 && b >= 0) {
  unpatched = unpatched.slice(0, a) + unpatched.slice(b);
}
unpatched = unpatched.replace(
  ",l===4&&treeFallApply(E,n,s,q,w,O,y,A,j,r)",
  ""
);
moduleCheck("unpatched-local", unpatched);

// also check DmJN
const dm = fs.readFileSync(
  "C:/Users/User/zombie-vs-plants/games/terraverse/assets/SandboxGame-DmJN1d3t.js",
  "utf8"
);
const dm2 = dm.replace(
  /from"\.\/static-index-[^"]+"/,
  'from"./static-index-USimIA2b.js"'
);
moduleCheck("dmjn", dm2);
