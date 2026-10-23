import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { pathToFileURL } from 'node:url';
import worker from './index.js';
export function startPhotoDevServer(env = process.env, port = 8787) {
  const server=createServer(async(req,res)=>{
    try {
      const url=new URL(req.url,'http://127.0.0.1:8787');
      const request=new Request(url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Readable.toWeb(req),duplex:'half'})});
      const response=await worker.fetch(request,env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
    }catch{res.writeHead(500,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end('{"error":{"code":"server_error"}}');}
  });
  server.listen(port,'127.0.0.1');return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){startPhotoDevServer();console.log('Photo development API listening on port 8787 (loopback only).');}
