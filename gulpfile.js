const gulp      = require('gulp');
const babel     = require('gulp-babel');
const gutil     = require('gulp-util');
const uglify    = require('gulp-uglify');
const concat    = require('gulp-concat');
const prefix    = require('gulp-autoprefixer');
const sass      = require('gulp-sass');
const sourcemaps= require('gulp-sourcemaps');

var config = {
    babel: {
        presets: ["env"]
    },
    sass: {
        outputStyle: 'compressed'
    }
}
var input = {
    stylesheet: 'src/scss/default.scss',
    javascript: Array('src/js/*.js', 'src/js/**/*.js', '!src/js/application/*.js', '!src/js/application/**/*.js'),
    application: Array('src/js/application/*.js', 'src/js/application/**/*.js')
}
var output = {
    stylesheet: 'dest/',
    javascript: 'dest/',
    application: 'dest/'
}
var production = {
    stylesheet: 'production/',
    javascript: 'production/',
    application: 'production/'
}
var watch = {
    stylesheet: Array('src/scss/default.scss', 'src/scss/**/*.scss'),
    javascript: Array('src/js/*.js', 'src/js/**/*.js', '!src/js/application/*.js', '!src/js/application/**/*.js'),
    application: Array('src/js/application/*.js', 'src/js/application/**/*.js'),
    new: Array('new/scss/*.scss', 'new/scss/**/*.scss')
}
var deploy = {
    stylesheet: 'UmbracoSolution/UApplication/Assets/stylesheets/',
    application: 'UmbracoSolution/UApplication/Assets/scripts/',
    javascript: 'UmbracoSolution/UApplication/Assets/scripts/'
}
gulp.task('new', function(){
    return gulp.src('new/scss/new.default.scss')
            .pipe(sourcemaps.init())
            .pipe(sass(config.sass).on('error', sass.logError))
            .pipe(prefix())
            .pipe(sourcemaps.write())
            .pipe(gulp.dest(deploy.stylesheet));
});
gulp.task('default', ['watch']);
gulp.task('stylesheet', function(){
    return gulp.src(input.stylesheet)
        .pipe(gutil.env.type !== 'production' ? sourcemaps.init() : gutil.noop())
        .pipe(sass(config.sass).on('error', sass.logError))
        .pipe(prefix())
        .pipe(gutil.env.type !== 'production' ? sourcemaps.write() : gutil.noop())
        .pipe(gutil.env.type !== 'production' ? gulp.dest(output.stylesheet) : gulp.dest(deploy.stylesheet));
});
gulp.task('scripts', function(){
    return gulp.src(input.javascript)
        .pipe(gutil.env.type !== 'production' ? sourcemaps.init() : gutil.noop())
        .pipe(concat('scripts.js'))
        .pipe(gutil.env.type !== 'production' ? gutil.noop() : uglify())
        .pipe(gutil.env.type !== 'production' ? sourcemaps.write() : gutil.noop())
        .pipe(gutil.env.type !== 'production' ? gulp.dest(output.javascript) : gulp.dest(deploy.javascript));
});
gulp.task('application', function(){
    return gulp.src(input.application)
        .pipe(gutil.env.type !== 'production' ? sourcemaps.init() : gutil.noop())
        .pipe(concat('application.js'))
        .pipe(babel(config.babel))
        .pipe(gutil.env.type !== 'production' ? gutil.noop() : uglify())
        .pipe(gutil.env.type !== 'production' ? sourcemaps.write() : gutil.noop())
        .pipe(gutil.env.type !== 'production' ? gulp.dest(output.application) : gulp.dest(deploy.application));
});
gulp.task('watch', ['scripts', 'stylesheet', 'application', 'new'], function(){
    gulp.watch(watch.javascript, ['scripts']);
    gulp.watch(watch.stylesheet, ['stylesheet']);
    gulp.watch(watch.application, ['application']);
    gulp.watch(watch.new, ['new']);
});
