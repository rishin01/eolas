const express = require('express')
const app = express()
const http = require('http');
const server = http.createServer(app);
const pug = require('pug');
var lensProtocol = require("lens-protocol");
// const fs = require('fs');

app.use(express.static('public'));
app.set('views', './views')
app.set('view engine', 'pug');
app.get('/', (req, res) => {
	res.render('index');
});

lensProtocol.Lens.ping().then((res) => {
	console.log(res);
}).catch((err) => {
	console.log(err);
});

function getdate(){
	let today = new Date();
	let dd = String(today.getDate()).padStart(2, '0');
	let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
	let yyyy = today.getFullYear();
	return dd + '/' + mm + '/' + yyyy;
}

function readRequestBody(req,callback){
	let body = [];
	req.on('error', (err) => {
		console.error(err);
	}).on('data', (chunk) => {
		body.push(chunk);
	}).on('end', () => {
		body = Buffer.concat(body).toString();
		body = JSON.parse(body);
		callback(body);
	});
}

function sendObjRes(res,obj){
	res.send(Buffer.from(JSON.stringify(obj)));
}

function sendHTMLRes(res,pugfile,pugparams,clientobj){
	res.render(pugfile,pugparams,function(err, pagebody){
		if (err) throw err;
		var result = clientobj;
		result['success'] = true;
		result['html'] = pagebody;
		sendObjRes(res,result);
	});
}

///////////////////////////

const port = process.env.PORT || 3000;
console.log('Start server: localhost:'+port)
server.listen(port);