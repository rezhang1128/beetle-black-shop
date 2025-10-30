const gulp = require('gulp');
const babel = require('gulp-babel');
const browserify = require('gulp-browserify');
const less = require('gulp-less');
const notify = require('gulp-notify');
const uglify = require('gulp-uglify');
const watch = require('gulp-watch');
const runSequence = require('run-sequence');

const paths = {
  SRC: './src',
  DIST: './dist',
  DEMO: './demo'
};

function logError(error) {
  const errorString = error.toString();
  notify.onError({
    title: 'Build Error',
    message: errorString
  })(error);
  console.log(errorString);
  this.emit('end');
}

gulp.task('buildjs', function() {
  return gulp.src(paths.SRC + '/*.js*')
  .pipe(babel({
    presets: ['es2015', 'react']
  }))
  .pipe(gulp.dest(paths.DIST));
});

gulp.task('buildDemo', function() {
  return gulp.src(paths.DIST + '/*.js*')
  .pipe(browserify({
      global: true,
      debug: true,
      extensions: ['.jsx']
    }))
    .on('error', logError)
    .pipe(uglify())
    .pipe(gulp.dest(paths.DEMO));
});

gulp.task('less', function() {
  return gulp.src(paths.SRC + '/*.less')
  .pipe(less())
  .on('error', logError)
  .pipe(gulp.dest(paths.DEMO));
});

gulp.task('watch', function() {
  watch(paths.SRC, function() {
    gulp.start('build-all');
  });
});

gulp.task('build-all', function() {
  gulp.start('buildjs', 'buildDemo', 'less');
});

gulp.task('start', function(cb) {
  return runSequence('build-all', ['watch'], cb);
});
