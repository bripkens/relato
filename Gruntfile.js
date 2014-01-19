'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    concat: {
      options: {
        separator: ';',
      },
      dev: {
        src: [
          'vendor/react/react.js',
          'vendor/promise-0.1.1.min/index.js',
          'vendor/fuzzy.js/fuzzy.js',
          'js/index.js'
        ],
        dest: 'app.js',
      },
    },

    clean: ['app.css', 'app.js'],

    sass: {
      dev: {
        options: {
          style: 'expanded',
          debugInfo: true,
          lineNumbers: true,
          compass: true,
          require: ['sass-css-importer']
        },
        files: {
          'app.css': 'scss/app.scss'
        }
      }
    },

    uglify: {
      dist: {
        options: {
          sourceMap: 'source-map.js'
        },
        files: {
          'app.js': [
            'vendor/react/react.min.js',
            'vendor/promise-0.1.1.min/index.js',
            'vendor/fuzzy.js/fuzzy.min.js',
            'js/index.js'
          ]
        }
      }
    },

    watch: {
      css: {
        files: 'scss/**/*',
        tasks: ['sass:dev']
      },
      js: {
        files: 'js/**/*',
        tasks: ['concat:dev']
      }
    }
  });

  [
    'grunt-contrib-clean',
    'grunt-contrib-concat',
    'grunt-contrib-sass',
    'grunt-contrib-uglify',
    'grunt-contrib-watch'
  ].forEach(grunt.loadNpmTasks.bind(grunt));


  grunt.registerTask('dev', [
    'clean',
    'sass:dev',
    'concat:dev',
    'watch'
  ]);
  grunt.registerTask('default', ['dev']);

};
