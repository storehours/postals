var fs = require("fs");
var exec = require("child_process").exec;

function pull(){
	console.log('getting latest from https://github.com/storehours/postals');
	exec('git init && ' +
		'git config --global user.name William Wicks && ' +
		'git config --global user.email wjwicks@gmail.com && ' +
		'git pull https://github.com/storehours/postals.git master', function(err, stdout){
		if(err) return console.error(err);
		console.log(stdout);
		download();
	});
}

function download(){
	console.log("downloading...");
	exec("curl http://download.geonames.org/export/zip/US.zip > US.zip", function(err){
		if(err) return console.error(err);

		console.log("unzipping...");
		exec("jar xf US.zip", function(err){
			if(err) return console.error(err);
			read();
		});
	});
}

function read() {
	var postals = {};
	console.log("reading...");
	var txt = fs.readFileSync("./US.txt", "utf8");
	txt.split('\n').forEach(function(line){
		if(!line) return;
		var columns = line.split('\t');
		postals[columns[1]] = [parseFloat(columns[9]), parseFloat(columns[10])];
	});
	format(postals);
}


function format(postals) {
	console.log("formatting...");
	//custom output format
	var out = ['{'];
	var keys = Object.keys(postals).sort(function(a,b){ return parseInt(a, 10) - parseInt(b, 10)});
	var end = keys.length-1;
	keys.forEach(function (postal, i) {
		var line = '"'+postal+'": '+ JSON.stringify(postals[postal]);
		if(i!=end)
			line += ',';
		out.push(line);
	});
	out.push('}');

	save(out.join('\n'));
}


function save(data){
	console.log("saving...");
	fs.writeFileSync("./data/US.json", data);
	add();
}


function add(){
	console.log("add...");
	exec('git add -v ./data/US.json', function(err, stdout, stderr){
		if(stderr) console.log(stderr);
		if(err) return console.error(err);
		if(stdout) {
			commit();
		}
		else {
			console.log("no changes.");
		}
	});
}

function commit(){
	console.log("commit...");
	exec('git commit -m "auto update"', function(err, stdout, stderr){
		if(stdout) console.log(stdout);
		if(stderr) console.log(stderr);
		if(err) return console.error(err);
		push();
	});
}

function push(){
	console.log("push...");
	exec('git push https://'+process.env.AUTH_TOKEN+'@github.com/storehours/postals.git', function(err, stdout, stderr){
		if(err) return console.error(err);
		if(stdout) console.log(stdout);
		if(stderr) console.log(stderr);

		console.log("done.");
	});
}

pull();
