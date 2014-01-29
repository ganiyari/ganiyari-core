'use strict';
var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;
var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};

module.exports = function (grunt) {
  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  // configurable paths
  var yeomanConfig = {
    app: 'app',
    dist: 'dist',
    test: 'test'
  };

  try {
    yeomanConfig.app = require('./package.json').appPath || yeomanConfig.app;
  } catch (e) {
  }

  grunt.initConfig({
    yeoman: yeomanConfig,
    watch: {
      // Tried to link watch to karma, so that watch can run all
      // the background tasks which need to run on file change, including
      // karma. Doesn't seem to be working.
      //
      // https://github.com/karma-runner/grunt-karma#karma-server-with-grunt-watchregarde
      // https://github.com/karma-runner/grunt-karma/issues/30
      // https://github.com/karma-runner/grunt-karma/issues/33
      // https://github.com/karma-runner/grunt-karma/issues/22
      // https://github.com/karma-runner/grunt-karma/issues/36
      //test: {
      //files: [
      //'<%= yeoman.app %>/**/*.js',
      //'<%= yeoman.test %>/unit/**/*.js',
      //'<%= yeoman.test %>/support/**/*.js'
      //],
      //tasks: ['karma:unitd:run']
      //}
    },
    connect: {
      options: {
        port: 9000,
        // Change this to '0.0.0.0' to access the server from outside.
        hostname: 'localhost'
      },
      test: {
        options: {
          middleware: function (connect) {
            return [
              mountFolder(connect, 'test')
            ];
          }
        }
      }
    },
    open: {
      server: {
        url: 'http://localhost:<%= connect.options.port %>'
      }
    },
    clean: {
      dist: {
        files: [
          {
            dot: true,
            src: [
              '<%= yeoman.app %>',
              '!<%= yeoman.dist %>/.git*'
            ]
          }
        ]
      },
      server: [
        '<%= yeoman.app %>/styles/*.css'
      ]
    },
    karma: {
      unit: {
        configFile: 'test/config/testacular.conf.js'
      },
      auto: {
        configFile: 'test/config/testacular.conf.js',
        autoWatch: true,
        singleRun: false
      }
      // Refer watch:test comment above
      //unitd: {
      //configFile: 'test/config/testacular.conf.js',
      //background: true
      //}
    },
    // All files are currently concatted based on usemin blocks in html
    // concat: {
    //   dist: {
    //     files: {
    //       '<%= yeoman.dist %>/scripts/scripts.js': [
    //         '<%= yeoman.app %>/scripts/**/*.js',
    //         '<%= yeoman.app %>/modules/**/*.js'
    //       ],
    //       '<%= yeoman.app %>/styles/.css/main.css': [
    //         '<%= yeoman.app %>/styles/.css/**/*.css',
    //       ]
    //     }
    //   }
    // },
    useminPrepare: {
      options: {
        dest: '<%= yeoman.dist %>'
      }
    },
    usemin: {
      options: {
        dirs: ['<%= yeoman.dist %>']
      }
    },
    copy: {
      dist: {
        files: [
          {
            expand: true,
            dot: true,
            cwd: '<%= yeoman.app %>',
            dest: '<%= yeoman.dist %>',
            src: [
              'components/**/*',
              'lib/**/*',
            ]
          }
        ]
      }
    }
  });

  grunt.renameTask('regarde', 'watch');

  grunt.registerTask('server', [
    'clean:server',
    'livereload-start',
    'connect:livereload',
    'open',
    'watch'
  ]);

  grunt.registerTask('test', [
    'clean:server',
    'connect:test',
    'karma:unit'
  ]);

  grunt.registerTask('dist', [
    'clean:dist',
    'useminPrepare',
    'concat',
    'copy',
    'usemin'
  ]);

  grunt.registerTask('build', [
    'test',
    'dist'
  ]);

  grunt.registerTask('default', ['build']);
};