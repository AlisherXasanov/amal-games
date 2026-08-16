const fs = require("fs");
const { spawnSync } = require("child_process");
const node = "C:/Users/User/zombie-vs-plants/.tools/node/node.exe";
const git = "C:/Users/User/zombie-vs-plants/games/_mingit/cmd/git.exe";
const harness = "C:/Users/User/zombie-vs-plants/games/_parse_harness";

fs.mkdirSync(harness, { recursive: true });
fs.writeFileSync(
  harness + "/static-index-USimIA2b.js",
  `export function n(){return{useRef:()=>({current:null}),useState:()=>[null,()=>{}],useEffect:()=>{},useCallback:f=>f};}
export const r=m=>m;
export const t=()=>({});
`
);

function check(label, src) {
  fs.writeFileSync(harness + "/game.mjs", src);
  const r = spawnSync(node, [harness + "/findpos.mjs"], { encoding: "utf8" });
  // use node to import and catch
  const r2 = spawnSync(
    node,
    [
      "-e",
      "import('file:///" +
        harness.replace(/\\/g, "/") +
        "/game.mjs').then(()=>console.log('OK')).catch(e=>console.log(e.message))",
    ],
    { encoding: "utf8", cwd: harness }
  );
  console.log(label, "import:", (r2.stdout || "").trim(), (r2.stderr || "").slice(0, 200));
}

// Extract from git commits
function gitShow(rev, file) {
  const r = spawnSync(git, ["show", rev + ":" + file], {
    encoding: "buffer",
    cwd: "C:/Users/User/zombie-vs-plants/games",
    maxBuffer: 20 * 1024 * 1024,
  });
  return r.stdout;
}

const revs = ["fec0846", "a1f5cf9", "576f813", "cea167b"];
for (const rev of revs) {
  try {
    const buf = gitShow(rev, "terraverse/assets/SandboxGame-BudqsLB0.js");
    if (!buf || !buf.length) {
      console.log(rev, "no BudqsLB0");
      continue;
    }
    const src = buf.toString("utf8");
    console.log(rev, "len", src.length, "treeFall", src.includes("treeFall"));
    fs.writeFileSync(harness + "/game.mjs", src);
    const r2 = spawnSync(node, ["--check", harness + "/game.mjs"], {
      encoding: "utf8",
      maxBuffer: 2 * 1024 * 1024,
    });
    const errLine = (r2.stderr || "")
      .split(/\r?\n/)
      .find((l) => /SyntaxError|Unexpected/.test(l));
    console.log(rev, "check", r2.status, errLine || "OK");
  } catch (e) {
    console.log(rev, e.message);
  }
}

// Also check immortality-era file that was working
const a1 = gitShow("a1f5cf9", "terraverse/assets/SandboxGame-BudqsLB0.js");
if (a1 && a1.length) {
  fs.writeFileSync(
    "C:/Users/User/zombie-vs-plants/games/terraverse/assets/SandboxGame-BudqsLB0.js",
    a1
  );
  console.log("wrote a1f5cf9 Budqs to working tree", a1.length);
}
