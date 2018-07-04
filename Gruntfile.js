/*
 After you have changed the settings at "Your code goes here",
 run this with one of these options:
  "grunt" alone creates a new, completed images directory
  "grunt clean" removes the images directory
  "grunt responsive_images" re-processes images without removing the old ones
*/

module.exports = function(grunt) {

  grunt.initConfig({
		responsive_images: {
			dev: {
				options: {
					engine: 'im',
					sizes: [
					{
						width: 400,
						quality: 40
					},
					{
						width: 560,
						quality: 40
					}
					]
				},

				/*
				You don't need to change this part if you don't change
				the directory structure.
				*/
				files: [{
					expand: true,
					src: ['*.{gif,jpg,png}'],
					cwd: 'img/',
					dest: 'img_res/'
				}]
			}
		},

		/* Clear out the images directory if it exists */
		clean: {
			dev: {
				src: ['img_res'],
			},
		},

		/* Generate the images directory if it is missing */
		mkdir: {
			dev: {
				options: {
					create: ['img_res']
				},
			},
		},

		/* Copy the original images into the images/directory */
		copy: {
			dev: {
				files: [{
					expand: true,
					src: 'img/*.{gif,jpg,png,svg}',
					dest: 'img_res/'
				}]
			},
		},
	 
		postcss: {
			options: {
				processors: [
					require('autoprefixer')({browsers: 'last 2 versions'}), // add vendor prefixes
				]
			},
			dist: {
				src: 'css/styles.css',
				dest: 'build/css/styles.css'
			}
		},
		
		// TODO: Implement cache busting
		/** cacheBust: {
			taskName: {
				options: {
					assets: ['dbhelper.js', 'restaurant_info.js', 'main.js', 'build/css/styles-b4c7c6a14b354b4d-b4c7c6a14b354b4d.css', 'js/controller-64c5704ca5fb73f2-64c5704ca5fb73f2.js'],
					separator: '-',
					deleteOriginals: true
				},
				src: ['index.html', 'restaurant.html','sw.js', 'Gruntfile.js']
			}
		}, */

		watch: {
			styles: {
					files: ['css/styles.css'],
					tasks: ['postcss']
			}

			/** versionchange: {
				files: ['dbhelper.js','restaurant_info.js', 'main.js','js/controller-64c5704ca5fb73f2-64c5704ca5fb73f2.js','build/css/styles-b4c7c6a14b354b4d-b4c7c6a14b354b4d.css'],
				tasks: ['cacheBust']
			}*/
		}
	});
    
    grunt.loadNpmTasks('grunt-responsive-images');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.loadNpmTasks('grunt-postcss');
	grunt.loadNpmTasks('grunt-contrib-watch');
	//grunt.loadNpmTasks('grunt-cache-bust');
    grunt.registerTask('default', ['clean', 'mkdir', 'copy', 'responsive_images','postcss']);
  }; 