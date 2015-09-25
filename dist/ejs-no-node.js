(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["ejs_no_node"] = factory();
	else
		root["ejs_no_node"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * EJS
	 * Copyright(c) 2012 TJ Holowaychuk <tj@vision-media.ca>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var utils = __webpack_require__(1);

	/**
	 * Filters.
	 *
	 * @type Object
	 */

	var filters = exports.filters = __webpack_require__(2);

	/**
	 * Intermediate js cache.
	 *
	 * @type Object
	 */

	/**
	 * Translate filtered code into function calls.
	 *
	 * @param {String} js
	 * @return {String}
	 * @api private
	 */

	function filtered(js) {
	  return js.substr(1).split('|').reduce(function(js, filter){
	    var parts = filter.split(':')
	      , name = parts.shift()
	      , args = parts.join(':') || '';
	    if (args) args = ', ' + args;
	    return 'filters.' + name + '(' + js + args + ')';
	  });
	};

	/**
	 * Re-throw the given `err` in context to the
	 * `str` of ejs, `filename`, and `lineno`.
	 *
	 * @param {Error} err
	 * @param {String} str
	 * @param {String} filename
	 * @param {String} lineno
	 * @api private
	 */

	function rethrow(err, str, filename, lineno){
	  var lines = str.split('\n')
	    , start = Math.max(lineno - 3, 0)
	    , end = Math.min(lines.length, lineno + 3);

	  // Error context
	  var context = lines.slice(start, end).map(function(line, i){
	    var curr = i + start + 1;
	    return (curr == lineno ? ' >> ' : '    ')
	      + curr
	      + '| '
	      + line;
	  }).join('\n');

	  // Alter exception message
	  err.path = filename;
	  err.message = (filename || 'ejs') + ':'
	    + lineno + '\n'
	    + context + '\n\n'
	    + err.message;

	  throw err;
	}

	/**
	 * Parse the given `str` of ejs, returning the function body.
	 *
	 * @param {String} str
	 * @return {String}
	 * @api public
	 */

	var parse = exports.parse = function(str, options){
	  var options = options || {}
	    , open = options.open || exports.open || '<%'
	    , close = options.close || exports.close || '%>'
	    , filename = options.filename
	    , compileDebug = options.compileDebug !== false
	    , buf = "";

	  buf += 'var buf = [];';
	  if (false !== options._with) buf += '\nwith (locals || {}) { (function(){ ';
	  buf += '\n buf.push(\'';

	  var lineno = 1;

	  var consumeEOL = false;
	  for (var i = 0, len = str.length; i < len; ++i) {
	    var stri = str[i];
	    if (str.slice(i, open.length + i) == open) {
	      i += open.length

	      var prefix, postfix, line = (compileDebug ? '__stack.lineno=' : '') + lineno;
	      switch (str[i]) {
	        case '=':
	          prefix = "', escape((" + line + ', ';
	          postfix = ")), '";
	          ++i;
	          break;
	        case '-':
	          prefix = "', (" + line + ', ';
	          postfix = "), '";
	          ++i;
	          break;
	        default:
	          prefix = "');" + line + ';';
	          postfix = "; buf.push('";
	      }

	      var end = str.indexOf(close, i);

	      if (end < 0){
	        throw new Error('Could not find matching close tag "' + close + '".');
	      }

	      var js = str.substring(i, end)
	        , start = i
	        , include = null
	        , n = 0;

	      if ('-' == js[js.length-1]){
	        js = js.substring(0, js.length - 2);
	        consumeEOL = true;
	      }

	      while (~(n = js.indexOf("\n", n))) n++, lineno++;

	      switch(js.substr(0, 1)) {
	        case ':':
	          js = filtered(js);
	          break;
	        case '%':
	          js = " buf.push('<%" + js.substring(1).replace(/'/g, "\\'") + "%>');";
	          break;
	        case '#':
	          js = "";
	          break;
	      }

	      if (js) {
	        if (js.lastIndexOf('//') > js.lastIndexOf('\n')) js += '\n';
	        buf += prefix;
	        buf += js;
	        buf += postfix;
	      }
	      i += end - start + close.length - 1;

	    } else if (stri == "\\") {
	      buf += "\\\\";
	    } else if (stri == "'") {
	      buf += "\\'";
	    } else if (stri == "\r") {
	      // ignore
	    } else if (stri == "\n") {
	      if (consumeEOL) {
	        consumeEOL = false;
	      } else {
	        buf += "\\n";
	        lineno++;
	      }
	    } else {
	      buf += stri;
	    }
	  }

	  if (false !== options._with) buf += "'); })();\n} \nreturn buf.join('');";
	  else buf += "');\nreturn buf.join('');";
	  return buf;
	};

	/**
	 * Compile the given `str` of ejs into a `Function`.
	 *
	 * @param {String} str
	 * @param {Object} options
	 * @return {Function}
	 * @api public
	 */

	var compile = exports.compile = function(str, options){
	  options = options || {};
	  var escape = options.escape || utils.escape;

	  var input = JSON.stringify(str)
	    , compileDebug = options.compileDebug !== false
	    , client = options.client
	    , filename = options.filename
	        ? JSON.stringify(options.filename)
	        : 'undefined';

	  if (compileDebug) {
	    // Adds the fancy stack trace meta info
	    str = [
	      'var __stack = { lineno: 1, input: ' + input + ', filename: ' + filename + ' };',
	      rethrow.toString(),
	      'try {',
	      exports.parse(str, options),
	      '} catch (err) {',
	      '  rethrow(err, __stack.input, __stack.filename, __stack.lineno);',
	      '}'
	    ].join("\n");
	  } else {
	    str = exports.parse(str, options);
	  }

	  if (options.debug) console.log(str);
	  if (client) str = 'escape = escape || ' + escape.toString() + ';\n' + str;

	  try {
	    var fn = new Function('locals, filters, escape, rethrow', str);
	  } catch (err) {
	    if ('SyntaxError' == err.name) {
	      err.message += options.filename
	        ? ' in ' + filename
	        : ' while compiling ejs';
	    }
	    throw err;
	  }

	  if (client) return fn;

	  return function(locals){
	    return fn.call(this, locals, filters, escape, rethrow);
	  }
	};

	/**
	 * Render the given `str` of ejs.
	 *
	 * Options:
	 *
	 *   - `locals`          Local variables object 
	 *   - `filename`        Used by `cache` to key caches
	 *   - `scope`           Function execution context
	 *   - `debug`           Output generated function body
	 *   - `open`            Open tag, defaulting to "<%"
	 *   - `close`           Closing tag, defaulting to "%>"
	 *
	 * @param {String} str
	 * @param {Object} options
	 * @return {String}
	 * @api public
	 */

	exports.render = function(str, options){
	  var fn
	    , options = options || {};

	  fn = compile(str, options);

	  options.__proto__ = options.locals;
	  return fn.call(options.scope, options);
	};


/***/ },
/* 1 */
/***/ function(module, exports) {

	
	/*!
	 * EJS
	 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
	 * MIT Licensed
	 */

	/**
	 * Escape the given string of `html`.
	 *
	 * @param {String} html
	 * @return {String}
	 * @api private
	 */

	exports.escape = function(html){
	  return String(html)
	    .replace(/&/g, '&amp;')
	    .replace(/</g, '&lt;')
	    .replace(/>/g, '&gt;')
	    .replace(/'/g, '&#39;')
	    .replace(/"/g, '&quot;');
	};
	 


/***/ },
/* 2 */
/***/ function(module, exports) {

	/*!
	 * EJS - Filters
	 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
	 * MIT Licensed
	 */

	/**
	 * First element of the target `obj`.
	 */

	exports.first = function(obj) {
	  return obj[0];
	};

	/**
	 * Last element of the target `obj`.
	 */

	exports.last = function(obj) {
	  return obj[obj.length - 1];
	};

	/**
	 * Capitalize the first letter of the target `str`.
	 */

	exports.capitalize = function(str){
	  str = String(str);
	  return str[0].toUpperCase() + str.substr(1, str.length);
	};

	/**
	 * Downcase the target `str`.
	 */

	exports.downcase = function(str){
	  return String(str).toLowerCase();
	};

	/**
	 * Uppercase the target `str`.
	 */

	exports.upcase = function(str){
	  return String(str).toUpperCase();
	};

	/**
	 * Sort the target `obj`.
	 */

	exports.sort = function(obj){
	  return Object.create(obj).sort();
	};

	/**
	 * Sort the target `obj` by the given `prop` ascending.
	 */

	exports.sort_by = function(obj, prop){
	  return Object.create(obj).sort(function(a, b){
	    a = a[prop], b = b[prop];
	    if (a > b) return 1;
	    if (a < b) return -1;
	    return 0;
	  });
	};

	/**
	 * Size or length of the target `obj`.
	 */

	exports.size = exports.length = function(obj) {
	  return obj.length;
	};

	/**
	 * Add `a` and `b`.
	 */

	exports.plus = function(a, b){
	  return Number(a) + Number(b);
	};

	/**
	 * Subtract `b` from `a`.
	 */

	exports.minus = function(a, b){
	  return Number(a) - Number(b);
	};

	/**
	 * Multiply `a` by `b`.
	 */

	exports.times = function(a, b){
	  return Number(a) * Number(b);
	};

	/**
	 * Divide `a` by `b`.
	 */

	exports.divided_by = function(a, b){
	  return Number(a) / Number(b);
	};

	/**
	 * Join `obj` with the given `str`.
	 */

	exports.join = function(obj, str){
	  return obj.join(str || ', ');
	};

	/**
	 * Truncate `str` to `len`.
	 */

	exports.truncate = function(str, len, append){
	  str = String(str);
	  if (str.length > len) {
	    str = str.slice(0, len);
	    if (append) str += append;
	  }
	  return str;
	};

	/**
	 * Truncate `str` to `n` words.
	 */

	exports.truncate_words = function(str, n){
	  var str = String(str)
	    , words = str.split(/ +/);
	  return words.slice(0, n).join(' ');
	};

	/**
	 * Replace `pattern` with `substitution` in `str`.
	 */

	exports.replace = function(str, pattern, substitution){
	  return String(str).replace(pattern, substitution || '');
	};

	/**
	 * Prepend `val` to `obj`.
	 */

	exports.prepend = function(obj, val){
	  return Array.isArray(obj)
	    ? [val].concat(obj)
	    : val + obj;
	};

	/**
	 * Append `val` to `obj`.
	 */

	exports.append = function(obj, val){
	  return Array.isArray(obj)
	    ? obj.concat(val)
	    : obj + val;
	};

	/**
	 * Map the given `prop`.
	 */

	exports.map = function(arr, prop){
	  return arr.map(function(obj){
	    return obj[prop];
	  });
	};

	/**
	 * Reverse the given `obj`.
	 */

	exports.reverse = function(obj){
	  return Array.isArray(obj)
	    ? obj.reverse()
	    : String(obj).split('').reverse().join('');
	};

	/**
	 * Get `prop` of the given `obj`.
	 */

	exports.get = function(obj, prop){
	  return obj[prop];
	};

	/**
	 * Packs the given `obj` into json string
	 */
	exports.json = function(obj){
	  return JSON.stringify(obj);
	};


/***/ }
/******/ ])
});
;