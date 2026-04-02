const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
 if (req.url.startsWith('/api/search')) {
   const q = url.parse(req.url, true).query.q;

   const response = {
     title: "Best result for " + q,
     best: "Sample Product AI Pick",
     price: "₹999",
     platform: "Amazon",
     link: "https://amazon.in"
   };

   res.writeHead(200, {'Content-Type': 'application/json'});
   res.end(JSON.stringify(response));
 } else {
   res.writeHead(200, {'Content-Type': 'text/html'});
   res.end(require('fs').readFileSync('index.html'));
 }
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
