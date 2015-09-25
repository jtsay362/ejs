var gulp = require('gulp');
var webpack = require('webpack');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var mocha = require('gulp-mocha');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

var ENTRY = './lib/ejs.js';
var DIST  = './dist';
var FILE = 'ejs-no-node.js';
var MODULE_FORMAT = 'umd';

gulp.task('bundle', function (cb) {
  var webpackConfig = {
    entry: ENTRY,
    output: {
      library: 'ejs_no_node',
      libraryTarget: MODULE_FORMAT,
      path: DIST,
      filename: FILE
    }
  };

  var compiler = webpack(webpackConfig);

  compiler.run(function (err, stats) {
    if (err) {
      throw err;
    }

    var jsonStats = stats.toJson();

    //console.log('jsonStats = ' + JSON.stringify(jsonStats));

    if (jsonStats.errors.length > 0) {
      throw jsonStats.errors.join(',');
    }

    if (jsonStats.warnings.length > 0) {
      console.warn(jsonStats.warnings.join(','));
    }

    console.log('UMD bundle completed.');

    cb();
  });
});

gulp.task('uglify', ['bundle'], function () {
  return gulp.src(DIST + '/' + FILE)
    .pipe(uglify({
      ie_proof: false
    }))
    .pipe(rename(function (path) {
      path.basename += '.min';
    }))
    .pipe(gulp.dest(DIST));
});

gulp.task('test', function () {
  return gulp.src('test/test.js')
    .pipe(mocha());
});

gulp.task('default', ['uglify']);
