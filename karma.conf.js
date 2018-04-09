const tsconfig = require('./tsconfig.json');

module.exports = function(config) {
  config.set({

    frameworks: ['jasmine', 'karma-typescript'],

    files: ['src/**/*.ts'],

    preprocessors: {
      'src/**/*.ts': ['karma-typescript'],
    },

    karmaTypescriptConfig: {
      compilerOptions: {
        lib: tsconfig.compilerOptions.lib
      }
    },

    reporters: ['progress', 'karma-typescript'],

    colors: true,
    autoWatch: false,
    browsers: ['PhantomJS'],
    singleRun: true,
    concurrency: Infinity,
    logLevel: config.LOG_INFO
  })
};
