'use strict';

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        watch: {
            test: {
                files: ['**/*.js'],
                tasks: ['mochaTest'],
                options: {
                    spawn: true
                }
            }
        },
        compress: {
            main: {
                options: {
                    archive: 'test/simple.zip'
                },
                files: [
                    // Each of the files in the src/ folder will be output to
                    // the dist/ folder each with the extension .gz.js
                    {
                        expand: true,
                        src: ['simple/**'],
                        cwd: 'test/usecase/'
                    }
                ]
            }
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/**/*.js']
            }
        }
    });


    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.registerTask('test', 'mochaTest');
    grunt.registerTask('watch-test', 'watch');
    grunt.registerTask('usecase', 'compress');


};