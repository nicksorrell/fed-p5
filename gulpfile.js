var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    minifyHTML = require('gulp-minify-html'),
    imagemin = require('gulp-imagemin'),
    del = require('del');

gulp.task('img', function(){
  return gulp.src('src/img/*.*')
        .pipe(imagemin())
        .pipe(gulp.dest('dist/img'));
});

gulp.task('css', function(){
  return gulp.src('src/css/*.css')
        .pipe(gulp.dest('dist/css'))
        .pipe(autoprefixer())
        .pipe(minifycss())
        .pipe(concat('style.css'))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('js', function(){
  return gulp.src(['src/js/vendor/*.js', 'src/js/*.js'])
        .pipe(uglify())
        .pipe(concat('app.js'))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('html-copy', function(){
  return gulp.src('src/*.html')
        .pipe(gulp.dest('dist'));
});

//Run this after the default task, and after you manually update the script tags to use the concat file
gulp.task('html-min', function(){
  return gulp.src('dist/*.html')
        .pipe(minifyHTML())
        .pipe(gulp.dest('dist'));
});

gulp.task('clean', function(){
  return del(['dist']);
});

gulp.task('default', ['clean'], function(){
  gulp.start('img', 'css', 'js', 'html-copy');
});
