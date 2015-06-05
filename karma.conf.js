// Karma configuration
// Generated on Mon Sep 01 2014 13:01:08 GMT+0200 (Hora de verano romance)

module.exports = function (config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],


        // list of files / patterns to load in the browser
        files: [
          'bower_components/angular/angular.min.js',
          'bower_components/angular-mocks/angular-mocks.js',
          'bower_components/lodash/dist/lodash.min.js',

          'src/module.js',
          'src/object.storage.service.js',
          'src/adapter.service.js',
          'src/indexed.collection.service.js',
          'src/indexed.page.cache.service.js',
          'src/event.emitter.service.js',
          'src/indexed.page.cache.service.js',
          'src/loader.service.js',
          'src/indexed.pager.service.js',
          'src/queue.service.js',

          'test/object.storage.service.test.js',
          'test/adapter.service.test.js',
          'test/indexed.collection.service.test.js',
          'test/indexed.page.cache.service.test.js',
          'test/event.emitter.service.test.js',
          'test/indexed.page.cache.service.test.js',
          'test/loader.service.test.js',
          'test/indexed.pager.service.test.js',
          'test/queue.service.test.js'
        ],


        // list of files to exclude
        exclude: [
        ],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
        },


        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress'],


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome'],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false
    });
};
