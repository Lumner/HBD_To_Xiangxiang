// 仅供本机回归检查，不会进入 dist 或 Pages 发布包。
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
http.createServer(async(req,res)=>{
  try{
    const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(!/^\/(dist|tests)\/[^/]+\.(html|js|css)$/.test(name))throw Error();
    const data=await readFile(path.join(root,name));
    res.writeHead(200,{'Content-Type':types[path.extname(name)],'Cache-Control':'no-store'});res.end(data);
  }catch{res.writeHead(404);res.end('Not found')}
}).listen(4174,'127.0.0.1',()=>console.log('http://127.0.0.1:4174/tests/touch-browser.html'));
