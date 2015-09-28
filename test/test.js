/**
 * Module dependencies.
 */

var ejs = require('..')
  , fs = require('fs')
  , read = fs.readFileSync
  , assert = require('should');

/**
 * Apparently someone wrote a test depending on a method
 * not included in the specified version of Should
 */
assert.Assertion.add('include', function (param) {
  if (this.obj.indexOf(param) > -1) {
  }
  else {
    throw new Error('Substring "' + param +
        '" not found in string "' + this.obj + '"');
  }
});


/**
 * Load fixture `name`.
 */

function fixture(name) {
  return read('test/fixtures/' + name, 'utf8').replace(/\r/g, '');
}

/**
 * User fixtures.
 */

var users = [];
users.push({ name: 'tobi' });
users.push({ name: 'loki' });
users.push({ name: 'jane' });

describe('ejs.compile(str, options)', function(){
  it('should compile to a function', function(){
    var fn = ejs.compile('<p>yay</p>');
    fn().should.equal('<p>yay</p>');
  })

  it('should throw if there are syntax errors', function(){
    try {
      ejs.compile(fixture('fail.ejs'));
    } catch (err) {
      err.message.should.include('compiling ejs');

      try {
        ejs.compile(fixture('fail.ejs'), { filename: 'fail.ejs' });
      } catch (err) {
        err.message.should.include('fail.ejs');
        return;
      }
    }

    assert(false, 'compiling a file with invalid syntax should throw an exception');
  })

  it('should allow customizing delimiters', function(){
    var fn = ejs.compile('<p>{= name }</p>', { open: '{', close: '}' });
    fn({ name: 'tobi' }).should.equal('<p>tobi</p>');

    var fn = ejs.compile('<p>::= name ::</p>', { open: '::', close: '::' });
    fn({ name: 'tobi' }).should.equal('<p>tobi</p>');

    var fn = ejs.compile('<p>(= name )</p>', { open: '(', close: ')' });
    fn({ name: 'tobi' }).should.equal('<p>tobi</p>');
  })

  it('should default to using ejs.open and ejs.close', function(){
    ejs.open = '{';
    ejs.close = '}';
    var fn = ejs.compile('<p>{= name }</p>');
    fn({ name: 'tobi' }).should.equal('<p>tobi</p>');

    var fn = ejs.compile('<p>|= name |</p>', { open: '|', close: '|' });
    fn({ name: 'tobi' }).should.equal('<p>tobi</p>');
    delete ejs.open;
    delete ejs.close;
  })

  it('should have a working client option', function(){
    var fn = ejs.compile('<p><%= foo %></p>', { client: true });
    var str = fn.toString();
    eval('var preFn = ' + str);
    preFn({ foo: 'bar' }).should.equal('<p>bar</p>');
  })
})

describe('ejs.render(str, options)', function(){
  it('should render the template', function(){
    ejs.render('<p>yay</p>')
      .should.equal('<p>yay</p>');
  })

  it('should accept locals', function(){
    ejs.render('<p><%= name %></p>', { name: 'tobi' })
      .should.equal('<p>tobi</p>');
  })
})

describe('<%=', function(){

  it('should escape &amp;<script>', function(){
    ejs.render('<%= name %>', { name: '&nbsp;<script>' })
      .should.equal('&amp;nbsp;&lt;script&gt;');
  })

  it("should escape '", function(){
    ejs.render('<%= name %>', { name: "The Jones's" })
      .should.equal('The Jones&#39;s');
  })

  it("should escape &foo_bar;", function(){
    ejs.render('<%= name %>', { name: "&foo_bar;" })
      .should.equal('&amp;foo_bar;');
  })
})

describe('<%-', function(){
  it('should not escape', function(){
    ejs.render('<%- name %>', { name: '<script>' })
      .should.equal('<script>');
  })

  it('should terminate gracefully if no close tag is found', function(){
    try {
      ejs.compile('<h1>oops</h1><%- name ->')
      throw new Error('Expected parse failure');
    } catch (err) {
      err.message.should.equal('Could not find matching close tag "%>".');
    }
  })
})

describe('%>', function(){
  it('should produce newlines', function(){
    ejs.render(fixture('newlines.ejs'), { users: users })
      .should.equal(fixture('newlines.html'));
  })
})

describe('-%>', function(){
  it('should not produce newlines', function(){
    ejs.render(fixture('no.newlines.ejs'), { users: users })
      .should.equal(fixture('no.newlines.html'));
  })
})

describe('<%%', function(){
  it('should produce literals', function(){
    ejs.render('<%%- "foo" %>')
      .should.equal('<%- "foo" %>');
  })
})

describe('single quotes', function(){
  it('should not mess up the constructed function', function(){
    ejs.render(fixture('single-quote.ejs'))
      .should.equal(fixture('single-quote.html'));
  })
})

describe('double quotes', function(){
  it('should not mess up the constructed function', function(){
    ejs.render(fixture('double-quote.ejs'))
      .should.equal(fixture('double-quote.html'));
  })
})

describe('backslashes', function(){
  it('should escape', function(){
    ejs.render(fixture('backslash.ejs'))
      .should.equal(fixture('backslash.html'));
  })
})

describe('messed up whitespace', function(){
  it('should work', function(){
    ejs.render(fixture('messed.ejs'), { users: users })
      .should.equal(fixture('messed.html'));
  })
})

describe('filters', function(){
  it('should work', function(){
    var items = ['foo', 'bar', 'baz'];
    ejs.render('<%=: items | reverse | first | reverse | capitalize %>', { items: items })
      .should.equal('Zab');
  })

  it('should accept arguments', function(){
    ejs.render('<%=: users | map:"name" | join:", " %>', { users: users })
      .should.equal('tobi, loki, jane');
  })

  it('should truncate string', function(){
    ejs.render('<%=: word | truncate: 3 %>', { word: 'World' })
      .should.equal('Wor');
  })

  it('should append string if string is longer', function(){
    ejs.render('<%=: word | truncate: 2,"..." %>', { word: 'Testing' })
      .should.equal('Te...');
  })

  it('should not append string if string is shorter', function(){
    ejs.render('<%=: word | truncate: 10,"..." %>', { word: 'Testing' })
      .should.equal('Testing');
  })

  it('should accept arguments containing :', function(){
    ejs.render('<%=: users | map:"name" | join:"::" %>', { users: users })
      .should.equal('tobi::loki::jane');
  })
})

describe('exceptions', function(){
  it('should produce useful stack traces', function(done){
    try {
      ejs.render(fixture('error.ejs'), { filename: 'error.ejs' });
    } catch (err) {
      err.path.should.equal('error.ejs');
      err.stack.split('\n').slice(0, 8).join('\n').should.equal(fixture('error.out'));
      done();
    }
  })

  it('should not include __stack if compileDebug is false', function() {
    try {
      ejs.render(fixture('error.ejs'), {
        filename: 'error.ejs',
        compileDebug: false
      });
    } catch (err) {
      err.should.not.have.property('path');
      err.stack.split('\n').slice(0, 8).join('\n').should.not.equal(fixture('error.out'));
    }
  });
})

describe('comments', function() {
  it('should fully render with comments removed', function() {
    ejs.render(fixture('comments.ejs'))
      .should.equal(fixture('comments.html'));
  })
})

describe('compileToFunctionString', function(){
  it('should compile to a string', function(){
    var fnString = ejs.compileToFunctionString('<p>yay</p>');
    (typeof fnString).should.equal('string');
  });

  it('should compile to a valid function string', function(){
    var fnString = ejs.compileToFunctionString('<p>yay <%= x %></p>', {
      functionName: 'render',
      client: true
    });

    console.log('function = ' + fnString);

    var locals = {
      x: 'hoo!'
    };
    eval(fnString + 'render(' + JSON.stringify(locals) + ')').should.equal(
      '<p>yay hoo!</p>');
  });
});
