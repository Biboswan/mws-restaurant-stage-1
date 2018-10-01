/* eslint-env node */

const gulp = require('gulp');
const rename = require('gulp-rename');
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const uglifyes = require('uglify-es');
const composer = require('gulp-uglify/composer');
const uglify = composer(uglifyes, console);
const sourcemaps = require('gulp-sourcemaps');
const imageResize = require('gulp-image-resize');

gulp.task('styles', () => {
  return gulp
    .src('css/**/*.css')
    .pipe(sourcemaps.init())
    .pipe(
      autoprefixer({
        browsers: ['last 2 versions'],
      })
    )
    .pipe(cleanCSS())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/css'))
    .pipe(browserSync.stream());
});

gulp.task('copy index.html', () => {
  return gulp.src('index.html').pipe(gulp.dest('dist'));
});

gulp.task('build sw.js', () => {
  return gulp
    .src(['sw.js', 'js/shared/*'])
    .pipe(sourcemaps.init())
    .pipe(concat('sw.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'));
});

gulp.task('copy restaurant.html', () => {
  return gulp.src('restaurant.html').pipe(gulp.dest('dist'));
});

gulp.task('scripts-common', () => {
  return gulp
    .src(['js/controller.js', 'js/shared/*', 'js/dbhelper.js'])
    .pipe(sourcemaps.init())
    .pipe(concat('all.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/js/'));
});

gulp.task('scripts-individual', () => {
  return gulp
    .src(['js/main.js', 'js/restaurant_info.js'])
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/js/'));
});

gulp.task('copy-images', () => {
  return gulp.src('img/*').pipe(gulp.dest('dist/img_res/img/'));
});

gulp.task('resize-images-400', () => {
  return gulp
    .src('img/*')
    .pipe(
      imageResize({
        width: 400,
        quality: 0.4,
        imageMagick: true,
      })
    )
    .pipe(
      rename(function(path) {
        path.basename += '-400';
      })
    )
    .pipe(gulp.dest('dist/img_res/'));
});

gulp.task('resize-images-560', () => {
  return gulp
    .src('img/*')
    .pipe(
      imageResize({
        width: 560,
        quality: 0.4,
        imageMagick: true,
      })
    )
    .pipe(
      rename(function(path) {
        path.basename += '-560';
      })
    )
    .pipe(gulp.dest('dist/img_res/'));
});

gulp.task('copy icons', () => {
  return gulp.src('icons/*').pipe(gulp.dest('dist/icons/'));
});

gulp.task('copy manifest and filter-icon', () => {
  return gulp
    .src(['manifest.json', 'filter.png', 'placeholder.png'])
    .pipe(gulp.dest('dist/'));
});

gulp.task(
  'default',
  gulp.parallel(
    'styles',
    'copy index.html',
    'copy restaurant.html',
    'scripts-common',
    'scripts-individual',
    'copy icons',
    'copy manifest and filter-icon',
    'copy-images',
    'resize-images-400',
    'resize-images-560',
    'build sw.js',
    done => {
      browserSync.init({
        server: './dist/',
      });
      gulp.watch('css/**/*.css', gulp.series('styles'));
      gulp.watch(
        'js/*.js',
        gulp.series('scripts-common', 'scripts-individual')
      );
      gulp.watch('index.html', gulp.series('copy index.html'));
      gulp.watch('restaurant html', gulp.series('copy restaurant.html'));
      gulp.watch('sw.js', gulp.series('build sw.js'));
      gulp.watch('dist/**/*.html').on('change', browserSync.reload);

      done();
    }
  )
);
