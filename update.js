var postals = require('./');
var fs = require("fs");
var exec = require("child_process").exec;
var assert = require('assert');

var timeout = setTimeout(function () {
  errd("Script timeout exceeded");
}, 300000);//5 min

function errd(err) {
  clearTimeout(timeout);
  console.error(err);
  process.exit(1);
}

function pull(){
	console.log('getting latest from https://github.com/storehours/postals');
	exec('git init && ' +
		'git config --global user.name William Kapke && ' +
		'git config --global user.email william.kapke@gmail.com && ' +
		'git pull https://github.com/storehours/postals.git master', function(err, stdout){
		if(err) return errd(err);
		console.log(stdout);
		download();
	});
}

function download(){
	console.log("downloading...");
	exec("curl http://download.geonames.org/export/zip/allCountries.zip > allCountries.zip", function(err){
		if(err) return errd(err);

		console.log("unzipping...");
		exec("jar xf allCountries.zip", function(err){
			if(err) return errd(err);
      sort();
		});
	});
}

function sort(){
  console.log('sorting the data');
  var lines = [];
  var data = postals.data;
  var reader = postals.iterate(data);

  var start = 0;

  do {
    lines.push(data.toString('utf8', start, (start = reader.next.line())));
  }
  while(!reader.eof);

  lines.sort((a, b) => a.localeCompare(b));

  console.log('writing data back to disk');
  var wstream = fs.createWriteStream(__dirname+'/allCountries.txt');
  lines.forEach(l=> wstream.write(l));

  wstream.on('finish', validate_diff);
  wstream.end();
}

function validate_diff(){
  console.log("ensure there weren't an abnormal amount of changes");
  exec("git diff --stat ./allCountries.txt", function(err, stdout, stderr){
    if(err) return errd(err);
    if(stderr) return errd(stderr);

    if(stdout) {
      console.log(stdout);
      var insertions = /(\d+) insertions/.exec(stdout)[1];
      var deletions = /(\d+) deletions/.exec(stdout)[1];
      if(Math.max(insertions, deletions) > 100) return errd("Too many changes!");

      validate_data();
    }
    else {
      console.log('No files changed');
      process.exit();
    }
  });
}

function validate_data(){
  console.log('validating data');
  var reader = postals.iterate();
  var field = 0;
  var line = 0;

  //iterate the data and ensure all lines contain 12 fields & valid coords
  while(!reader.eof) {
    if(reader.newline) {
      if(field % 12 !== 0) return errd('Invalid format on line ' + line);
      line++;
    }

    var val = reader.next.field;
    if(field===9 && !/^-?\d{1,2}\.\d+$/.test(val)) return errd('Invalid latitude on line ' + line);
    if(field===10 && !/^-?\d{1,3}\.\d+$/.test(val)) return errd('Invalid longitude on line ' + line);

    field++;
  }

  index();
}

function index(){
  console.log('creating index');
  var reader = postals.iterate();
  var index = {};
  var lineno = 0;

  do{
    var cc = reader.next.field;
    if(!cc) return index;

    var country = index[cc];
    if(!country) {
      index[cc] = { start: lineno, lines: 1 };
    }
    else {
      country.lines ++;
    }
  }
  while(lineno = reader.next.line());

  fs.writeFileSync(__dirname+'/index.json', JSON.stringify(index, null, 2));

  add();
}

function add(){
	console.log("adding local changes to git");

	exec('git add -v ./allCountries.txt ./index.json', function(err, stdout, stderr){
    if(err) return errd(err);
    if(stderr) return errd(stderr);

		if(stdout) {
			commit();
		}
		else {
      return errd('No changes? That\'s not right!');
		}
	});
}

function commit(){
	console.log("commit changes to git");
	exec('npm version patch --no-git-tag-version && git commit -m "auto update"', function(err, stdout, stderr){
    if(err) return errd(err);
    if(stderr) return errd(stderr);
    if(stdout) console.log(stdout);

		push();
	});
}

function push(){
	console.log("push to github");
	exec('git push https://'+process.env.AUTH_TOKEN+'@github.com/storehours/postals.git', function(err, stdout, stderr){
		if(err) return errd(err);
		if(stderr) return errd(stderr);
    if(stdout) console.log(stdout);

		console.log("done.");
    process.exit();
	});
}

//validate_diff();
sort();
//download();
//pull();
