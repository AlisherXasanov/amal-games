const fs = require("fs");

const path =
  "C:/Users/User/zombie-vs-plants/games/terraverse/assets/SandboxGame-BudqsLB0.js";
let s = fs.readFileSync(path, "utf8");

if (s.includes("function treeFall(")) {
  console.log("already has treeFall");
  process.exit(0);
}

const marker =
  "function oe(e,t,n,r=8){let i=!0,a=0;for(;i&&a++<40;){i=!1;for(let a=Math.min(e.h-2,n+r);a>=Math.max(0,n-r);a--)for(let n=Math.max(0,t-r);n<=Math.min(e.w-1,t+r);n++)g(e,n,a)&&(i=!0)}}";

if (!s.includes(marker)) {
  console.error("oe marker missing");
  process.exit(1);
}

// Safer treeFall: no template literals, no for-of destructure edge cases
const treeFall =
  "function treeFall(e,t,n){var r=[[1,0],[-1,0],[0,1],[0,-1]],a={},o=[],s=[],c,l,f,p,m,h,v,y,b,x;for(c=0;c<4;c++){l=t+r[c][0],f=n+r[c][1],p=u(e,l,f);if(p===4||p===5){m=l+\"/\"+f;if(!a[m]){a[m]=1;o.push(l,f)}}}while(o.length){l=o.pop(),f=o.pop(),p=u(e,l,f),s.push(l,f,p);if(s.length/3>56)return null;for(c=0;c<4;c++){h=l+r[c][0],v=f+r[c][1],m=h+\"/\"+v;if(a[m])continue;y=u(e,h,v);if(y===4||y===5){a[m]=1;o.push(h,v)}}}if(!s.length)return null;b=!1;x=0;for(c=0;c<s.length;c+=3){if(s[c+2]===5)b=!0;if(s[c+2]===4)x++}if(!b){if(x<1)return null;var j=s[0],k=s[0];for(c=0;c<s.length;c+=3)if(s[c+2]===4){if(s[c]<j)j=s[c];if(s[c]>k)k=s[c]}if(k-j>0)return null}var S={};for(c=0;c<s.length;c+=3)S[s[c]+\"/\"+s[c+1]]=1;for(c=0;c<s.length;c+=3){if(s[c+2]!==4)continue;y=u(e,s[c],s[c+1]+1);if(y===4&&S[s[c]+\"/\"+(s[c+1]+1)])continue;if(y===5||y===0||y===7||y===12||y===13||y===14||y===17||y===18||y===20||y===25)continue;if(i[y]&&i[y].solid)return null}var D=[];for(c=0;c<s.length;c+=3){D.push(s[c+2]);d(e,s[c],s[c+1],0)}oe(e,t,n,12);return D}";

s = s.replace(marker, marker + treeFall);

const mineMarker =
  "A.current.mined+=1,j.current+=1,C.current=null,oe(E,n,s,14),(l===7||l===3)&&_e(E)";
const mineReplace =
  "A.current.mined+=1,j.current+=1,C.current=null,oe(E,n,s,14),l===4&&treeFallApply(E,n,s,q,w,O,y,A,j,r),(l===7||l===3)&&_e(E)";

if (!s.includes(mineMarker)) {
  console.error("mine marker missing");
  process.exit(1);
}

// Helper lives next to treeFall — keeps the mine if() comma-chain simple (no IIFE)
const helper =
  "function treeFallApply(E,n,s,q,w,O,y,A,j,r){var e=treeFall(E,n,s),t,i;if(!e||!e.length)return;for(t=0;t<e.length;t++){i=e[t];if(!q.current&&i!==17&&i!==20&&i!==13)w.current[i]=(w.current[i]||0)+1;if(i===5&&Math.random()<.08){O.current.apple+=1;y.current.push({x:n*24,y:s*24,text:\"\\uD83C\\uDF4E\",life:1,color:\"#ff6666\"})}A.current.mined+=1;j.current+=1}r(\"\\u0414\\u0435\\u0440\\u0435\\u0432\\u043E \\u0443\\u043F\\u0430\\u043B\\u043E!\")}";

s = s.replace(marker + treeFall, marker + treeFall + helper);
s = s.replace(mineMarker, mineReplace);

fs.writeFileSync(path, s);
console.log("patched", s.length);
console.log("treeFall", s.includes("function treeFall("));
console.log("apply", s.includes("treeFallApply"));
console.log("hook", s.includes("l===4&&treeFallApply"));
