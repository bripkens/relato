'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    clean: ['app.css'],

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

    watch: {
      css: {
        files: 'scss/**/*',
        tasks: ['sass:dev']
      }
    }
  });

  [
    'grunt-contrib-clean',
    'grunt-contrib-sass',
    'grunt-contrib-watch'
  ].forEach(grunt.loadNpmTasks.bind(grunt));


  grunt.registerTask('dev', [
    'clean',
    'sass:dev',
    'watch'
  ]);
  grunt.registerTask('default', ['dev']);

};
