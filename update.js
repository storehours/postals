var fs = require("fs");
var script = "curl http://download.geonames.org/export/zip/US.zip > US.zip && unzip US.zip -d ./temp && rm US.zip";

console.log("downloading...");
require('child_process').exec("curl http://download.geonames.org/export/zip/US.zip > US.zip", function(err){
	if(err) return console.error(err);

	console.log("unzipping...");
	require('child_process').exec("unzip -o US.zip -d ./temp", function(err){
		if(err) return console.error(err);

		console.log("cleanup...");
		require('child_process').exec("rm US.zip", function(err){
			if(err) return console.error(err);

			read();
		});
	});
});

function read() {
	var postals = {};
	console.log("reading...");
	var txt = fs.readFileSync("./temp/US.txt", "utf8");
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

	console.log("done.");
}



