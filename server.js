import http from 'http';
import url from 'url';
import fetch from 'node-fetch';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function askGroq(query){
 try {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions",{
    method:"POST",
    headers:{
      "Authorization":"Bearer "+GROQ_API_KEY,
      "Content-Type":"application/json"
    },
    body: JSON.stringify({
      model:"llama3-70b-8192",
      messages:[{role:"user",content:`Suggest best product for: ${query}. Give name, reason, price, link.`}]
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No result";
 } catch(e){
  return "Error generating response";
 }
}

const server = http.createServer(async (req,res)=>{

 res.setHeader("Access-Control-Allow-Origin","*");
 res.setHeader("Access-Control-Allow-Methods","GET, POST");
 res.setHeader("Access-Control-Allow-Headers","Content-Type");

 if(req.method === "OPTIONS"){
   res.writeHead(200);
   res.end();
   return;
 }

 if(req.url.startsWith("/api/search")){
   const q = url.parse(req.url,true).query.q;

   const aiText = await askGroq(q);

   const response = {
     title: "Best result for "+q,
     best: aiText,
     reason: "AI generated recommendation",
     price: "Check link",
     link: "https://google.com"
   };

   res.writeHead(200,{"Content-Type":"application/json"});
   res.end(JSON.stringify(response));
 } else {
   res.writeHead(200,{"Content-Type":"text/plain"});
   res.end("Bazaaro backend running");
 }
});

server.listen(3000,()=>console.log("Server running"));
