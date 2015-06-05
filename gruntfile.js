module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        concat: {
            options: {
                separator: ''
            },
            angular_window: {
                src: [
                    'src/module.js',
                    'src/object.storage.service.js',
                    'src/adapter.service.js',
                    'src/indexed.collection.service.js',
                    'src/queue.service.js',
                    'src/indexed.page.cache.service.js',
                    'src/event.emitter.service.js',
                    'src/indexed.page.cache.service.js',
                    'src/loader.service.js',
                    'src/indexed.pager.service.js'
                ],
                dest: 'dist/js.data.manager.js'
            },
            angular_commonjs: {
                src: [
                    'build/angular/commonjs.begin.js',
                    'dist/js.data.manager.js',
                    'build/angular/commonjs.end.js'
                ],
                dest: 'dist/js.data.manager.commonjs.js'
            },
            angular_amd: {
                src: [
                    'build/angular/amd.begin.js',
                    'dist/js.data.manager.js',
                    'build/angular/amd.end.js'
                ],
                dest: 'dist/js.data.manager.amd.js'
            },
            vanilla_window: {
                src: [
                    'build/vanilla/window.begin.js',
                    'build/vanilla/fake.angular.js',
                    'dist/js.data.manager.js',
                    'build/vanilla/window.end.js'
                ],
                dest: 'dist/js.data.manager.vanilla.js'
            },
            vanilla_commonjs: {
                src: [
                    'build/vanilla/commonjs.begin.js',
                    'build/vanilla/fake.angular.js',
                    'dist/js.data.manager.js',
                    'build/vanilla/commonjs.end.js'
                ],
                dest: 'dist/js.data.manager.vanilla.common.js'
            },
            vanilla_amd: {
                src: [
                    'build/vanilla/amd.begin.js',
                    'build/vanilla/fake.angular.js',
                    'dist/js.data.manager.js',
                    'build/vanilla/amd.end.js'
                ],
                dest: 'dist/js.data.manager.vanilla.amd.js'
            }
        },
        closurecompiler: {
            options: {
                compilation_level: 'ADVANCED_OPTIMIZATIONS',
                language_in: 'ECMASCRIPT5_STRICT'
            },
            angular_window: {
                files: {
                    'dist/js.data.manager.min.js': [
                        'dist/js.data.manager.js'
                    ]
                }
            },
            angular_commonjs: {
                files: {
                    'dist/js.data.manager.commonjs.min.js': [
                        'dist/js.data.manager.commonjs.js'
                    ]
                }
            },
            angular_amd: {
                files: {
                    'dist/js.data.manager.amd.min.js': [
                        'dist/js.data.manager.amd.js'
                    ]
                }
            },
            vanilla_window: {
                files: {
                    'dist/js.data.manager.vanilla.min.js': [
                        'dist/js.data.manager.vanilla.js'
                    ]
                }
            },
            vanilla_commonjs: {
                files: {
                    'dist/js.data.manager.vanilla.common.min.js': [
                        'dist/js.data.manager.vanilla.common.js'
                    ]
                }
            },
            vanilla_amd: {
                files: {
                    'dist/js.data.manager.vanilla.amd.min.js': [
                        'dist/js.data.manager.vanilla.amd.js'
                    ]
                }
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-closurecompiler');

    //Concat tasks
    grunt.registerTask('combine', [
        'concat:angular_window',
        'concat:angular_commonjs',
        'concat:angular_amd',
        'concat:vanilla_window',
        'concat:vanilla_commonjs',
        'concat:vanilla_amd'
    ]);

    grunt.registerTask('closure', [
        'closurecompiler:angular_window',
        'closurecompiler:angular_commonjs',
        'closurecompiler:angular_amd',
        'closurecompiler:vanilla_window',
        'closurecompiler:vanilla_commonjs',
        'closurecompiler:vanilla_amd'
    ]);


    // Default task(s).
    grunt.registerTask('default', ['combine', 'closure']);

};
