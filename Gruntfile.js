module.exports = function(grunt) {
  
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    htmljson: {
      template: {
        src: ['src/**.html'],
        dest: 'src/temp.json',        
      },
    },
    browserify: {
      dist: {
        files: {
          'dist/terminalify.js': ['src/main.js'],
        },
      },
    },
    sass: {
      dist: {                            
        options: {                       
          style: 'expanded',
          sourcemap: 'none'
        },
        files: {                         
          'dist/terminalify.css': 'src/styles.scss'
        }
      }
    },
    shell: {
        runserver: {
            command: 'http-server . -o -c-1'
        }
    },
    watch: {
      configFiles: {
        files: [ 'src/**/*', '!src/temp.json', 'index.html' ],
        tasks: ['build'],
        options: {
          livereload: 35729
        }
      }
    },
    concurrent: {
        runandwatch: ['shell:runserver', 'watch'],
    },
    clean: {
      temp: ["src/temp.json"],
    }
  });

  // Load the plugins FTW
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-htmljson');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-concurrent');

  // Default tasks
  grunt.registerTask('default', ['build', 'concurrent:runandwatch']);

  grunt.registerTask('build', ['htmljson', 'browserify', 'sass', 'clean:temp'])

};