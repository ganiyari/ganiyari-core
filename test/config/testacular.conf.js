basePath = '../';

files = [
  JASMINE,
  JASMINE_ADAPTER,
  '../bower_components/jquery/jquery.js',
  '../app/**/*.js',
  '../app/modules/core/*.js',
  '../test/*.js'
];

singleRun = true;

browsers = ['PhantomJS'];

reporters = ['dots', 'junit'];
junitReporter = {
  outputFile: 'output/unit.xml',
  suite: 'unit'
};
