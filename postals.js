
var tab = 0x09;
var newline = 0x0A;

function iterate(buffer, i){
  i = i || 0;
  var l = buffer.length;
  while(buffer[l-1] === newline) l--;

  var r = {
    get newline(){
      return i===0 || buffer[i-1] === newline;
    },
    next: function(match){
      while(i <= l) {
        var c = buffer[i++];
        if(match(c))
          break;
      }
      return i;
    },
    get eof(){
      return i >= l;
    }
  };

  function tab_nl(c){ return c === tab || c === newline }

  Object.defineProperties(r.next, {
    field: { get: function(){
      var start = i;
      var end = r.next(tab_nl)-1;
      return buffer.toString('utf8', start, end);
    }},
    line: { value: function () {
      while(i < l) {
        var c = buffer[i++];
        if(c === newline) return i;
      }
    }},
    object: { get: function(){
      if(r.eof) return;
      if(!r.newline) throw new Error("Invalid starting point");
      return {
        country_code: this.field,
        postal_code: this.field,
        place_name: this.field,
        admin_name1: this.field,
        admin_code1: this.field,
        admin_name2: this.field,
        admin_code2: this.field,
        admin_name3: this.field,
        admin_code3: this.field,
        latitude: this.field,
        longitude: this.field,
        accuracy: this.field
      };
    }}
  });

  return r;
}



exports = module.exports = {
  get data() {
    return require('fs').readFileSync(__dirname+'/allCountries.txt');
  },
  get index() {
    return require('./index.json');
  },
  iterate: function(data, i){
    return iterate(data || exports.data, i);
  }
};

//add getters for the countries: e.g.: postals.US, postals.AU, ...etc
Object.keys(exports.index).forEach(function (cc) {
  Object.defineProperty(exports, cc, {
    get: function(){
      var reader = exports.iterate(null, exports.index[cc].start);
      var next = reader.next;
      var out = [];

      while(true){
        var obj = next.object;
        if(!obj || obj.country_code!==cc) break;
        out.push(obj);
      }

      return out;
    }
  });
});
