const fs = require("fs");
const { spawnSync } = require("child_process");
const git = "C:/Users/User/zombie-vs-plants/games/_mingit/cmd/git.exe";
const node = "C:/Users/User/zombie-vs-plants/.tools/node/node.exe";
const root = "C:/Users/User/zombie-vs-plants/games";
const assets = root + "/terraverse/assets";

function gitShow(rev, file) {
  const r = spawnSync(git, ["show", `${rev}:${file}`], {
    cwd: root,
    encoding: "buffer",
    maxBuffer: 30 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error(r.stderr.toString());
  return r.stdout; // Buffer
}

// Restore known-good files as raw buffers (no CRLF mangling)
const files = [
  ["fec0846", "terraverse/assets/SandboxGame-BudqsLB0.js"],
  ["fec0846", "terraverse/assets/static-index-USimIA2b.js"],
  ["fec0846", "terraverse/index.html"],
];
for (const [rev, file] of files) {
  const buf = gitShow(rev, file);
  fs.writeFileSync(root + "/" + file, buf);
  console.log("restored", file, buf.length);
}

let s = fs.readFileSync(assets + "/SandboxGame-BudqsLB0.js", "utf8");
console.log("sandbox chars", s.length, "hasCR", s.includes("\r"));

// Apply safe tree fall patch
const marker =
  "function oe(e,t,n,r=8){let i=!0,a=0;for(;i&&a++<40;){i=!1;for(let a=Math.min(e.h-2,n+r);a>=Math.max(0,n-r);a--)for(let n=Math.max(0,t-r);n<=Math.min(e.w-1,t+r);n++)g(e,n,a)&&(i=!0)}}";
if (!s.includes(marker)) throw new Error("oe marker missing");
if (s.includes("function treeFall(")) throw new Error("already patched");

const treeFall =
  "function treeFall(e,t,n){var r=[[1,0],[-1,0],[0,1],[0,-1]],a={},o=[],s=[],c,l,f,p,m,h,v,y,b,x,j,k,S,D;for(c=0;c<4;c++){l=t+r[c][0],f=n+r[c][1],p=u(e,l,f);if(p===4||p===5){m=l+\"/\"+f;if(!a[m]){a[m]=1;o.push(l,f)}}}while(o.length){l=o.pop(),f=o.pop();p=u(e,l,f);s.push(l,f,p);if(s.length/3>56)return null;for(c=0;c<4;c++){h=l+r[c][0],v=f+r[c][1],m=h+\"/\"+v;if(a[m])continue;y=u(e,h,v);if(y===4||y===5){a[m]=1;o.push(h,v)}}}if(!s.length)return null;b=!1;x=0;for(c=0;c<s.length;c+=3){if(s[c+2]===5)b=!0;if(s[c+2]===4)x++}if(!b){if(x<1)return null;j=null;k=null;for(c=0;c<s.length;c+=3)if(s[c+2]===4){if(j===null||s[c]<j)j=s[c];if(k===null||s[c]>k)k=s[c]}if(k-j>0)return null}S={};for(c=0;c<s.length;c+=3)S[s[c]+\"/\"+s[c+1]]=1;for(c=0;c<s.length;c+=3){if(s[c+2]!==4)continue;y=u(e,s[c],s[c+1]+1);if(y===4&&S[s[c]+\"/\"+(s[c+1]+1)])continue;if(y===5||y===0||y===7||y===12||y===13||y===14||y===17||y===18||y===20||y===25)continue;if(i[y]&&i[y].solid)return null}D=[];for(c=0;c<s.length;c+=3){D.push(s[c+2]);d(e,s[c],s[c+1],0)}oe(e,t,n,12);return D}" +
  "function treeFallApply(E,n,s,q,w,O,y,A,j,r){var e=treeFall(E,n,s),t,i;if(!e||!e.length)return;for(t=0;t<e.length;t++){i=e[t];if(!q.current&&i!==17&&i!==20&&i!==13)w.current[i]=(w.current[i]||0)+1;if(i===5&&Math.random()<.08){O.current.apple+=1;y.current.push({x:n*24,y:s*24,text:\"\\uD83C\\uDF4E\",life:1,color:\"#ff6666\"})}A.current.mined+=1;j.current+=1}r(\"\\u0414\\u0435\\u0440\\u0435\\u0432\\u043E \\u0443\\u043F\\u0430\\u043B\\u043E!\")}";

s = s.replace(marker, marker + treeFall);

const mineMarker =
  "A.current.mined+=1,j.current+=1,C.current=null,oe(E,n,s,14),(l===7||l===3)&&_e(E)";
if (!s.includes(mineMarker)) throw new Error("mine marker missing");
s = s.replace(
  mineMarker,
  "A.current.mined+=1,j.current+=1,C.current=null,oe(E,n,s,14),l===4&&treeFallApply(E,n,s,q,w,O,y,A,j,r),(l===7||l===3)&&_e(E)"
);

// Write as NEW filename to bust caches without ?query= (avoids dual React)
const newName = "SandboxGame-TreeFix2.js";
fs.writeFileSync(assets + "/" + newName, s);
console.log("wrote", newName, Buffer.byteLength(s, "utf8"));

let entry = fs.readFileSync(assets + "/static-index-USimIA2b.js", "utf8");
entry = entry.replace(/SandboxGame-[A-Za-z0-9_-]+\.js(\?v=[^`'"]*)?/g, newName);
fs.writeFileSync(assets + "/static-index-USimIA2b.js", entry);
console.log("entry points", entry.includes(newName));

// Keep index.html WITHOUT query on the module (critical for single React instance)
let html = fs.readFileSync(root + "/terraverse/index.html", "utf8");
html = html.replace(/static-index-USimIA2b\.js(\?v=[^"']*)?/, "static-index-USimIA2b.js");
// Force new entry filename copy for cache bust
const entryNew = "static-index-TreeFix2.js";
fs.copyFileSync(assets + "/static-index-USimIA2b.js", assets + "/" + entryNew);
// But SandboxGame imports ./static-index-USimIA2b.js by name — keep that filename!
// Only change index.html to load a renamed entry that is a copy — WAIT that breaks because
// SandboxGame imports static-index-USimIA2b.js specifically.
// So: rename both in lockstep OR only rename SandboxGame (entry content changes so CDNs refresh if no long cache).
// GitHub pages often caches aggressively. Rename entry AND update SandboxGame's import.

s = s.replace(
  'from"./static-index-USimIA2b.js"',
  'from"./static-index-TreeFix2.js"'
);
fs.writeFileSync(assets + "/" + newName, s);
fs.writeFileSync(assets + "/" + entryNew, entry);
html = html.replace(
  /src="\.\/assets\/static-index[^"]+"/,
  `src="./assets/${entryNew}"`
);
fs.writeFileSync(root + "/terraverse/index.html", html);
console.log("index:", html.match(/src="\.\/assets\/static-index[^"]+"/)[0]);
console.log("done");
