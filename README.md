# Restaurant Reviews
---

## Project Overview: Stage 1

This project is a part of the Udacity Mobile Web Specialist Nanodegree Certification Program. 

### Specification

Code for a restaurant reviews website has been provided. The code has a lot of issues. It’s barely usable on a desktop browser, much less a mobile device. It also doesn’t include any standard accessibility features, and it doesn’t work offline at all. Job for stage1 is to update the code to resolve these issues while still maintaining the included functionality. 

### Setup

1. run `npm install`
2. run `grunt` to resize images for different resolutions
3. In this folder, start up a simple HTTP server to serve up the site files on your local computer. Python has some simple tools to do this and you don't even need to know Python. For most people, it's already installed on your computer.

In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use.) For Python 3.x, you can use `python3 -m http.server 8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.
4. With your server running, visit the site: `http://localhost:8000`, and look around for a bit to see what the current experience looks like.
5. run `grunt watch` which watches for updates in `css/styles.css` and creates a build css with autoprefixer plugin implemented.
