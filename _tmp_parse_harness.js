const fs = require("fs");
const { spawnSync } = require("child_process");

// Use node's module parser via creating a stub for the import
const assets = "C:/Users/User/zombie-vs-plants/games/terraverse/assets";
const stub = `
export function n(){ return { useRef(){return{current:null}}, useState(){return[null,()=>{}]}, useEffect(){}, useCallback(f){return f}, useMemo(f){return f()}, createElement(){return null}, Fragment:'f' }; }
export const r = (m) => m;
export const t = () => ({});
`;
fs.writeFileSync(assets + "/static-index-USimIA2b.js.__stub_bak", "bak");
// Instead write a tiny harness folder
const dir = "C:/Users/User/zombie-vs-plants/games/_parse_harness";
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(
  dir + "/static-index-USimIA2b.js",
  `export function n(){return{useRef:()=>({current:null}),useState:()=>[null,()=>{}],useEffect:()=>{},useCallback:f=>f,createElement:()=>null};}
export const r=m=>[m,{}];
export const t=()=>({jsx:()=>null,jsxs:()=>null,Fragment:'F'});
`
);

function testFile(srcName) {
  const src = fs.readFileSync(assets + "/" + srcName, "utf8");
  // rewrite import to local stub
  const out = src.replace(
    /from"\.\/static-index-USimIA2b\.js"/,
    'from"./static-index-USimIA2b.js"'
  );
  fs.writeFileSync(dir + "/game.js", out);
  // copy stub already there
  const r = spawnSync(
    "C:/Users/User/zombie-vs-plants/.tools/node/node.exe",
    ["--check", dir + "/game.js"],
    { encoding: "utf8" }
  );
  console.log(srcName, "check status", r.status);
  if (r.stderr) console.log(r.stderr.slice(0, 500));
}

testFile("SandboxGame-BtreeFall1.js");
testFile("_good_Sandbox.js");
testFile("SandboxGame-DmJN1d3t.js");
