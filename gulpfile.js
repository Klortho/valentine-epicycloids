const gulp = require('gulp');
const rollup = require('rollup-stream');
const source = require('vinyl-source-stream');


gulp.task('copy', () => {
  return gulp.src(['src/*.html', 'src/*.css'])
    .pipe(gulp.dest('dist'));
});

gulp.task('rollup', () => {
  return rollup({
      input: 'src/main.js',
      name: 'EpiValentine',
      format: 'umd',
    })
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./dist'));
});

gulp.task('default', ['copy', 'rollup'], done => {
  done();
});
