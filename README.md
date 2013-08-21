Backbone Eye
============

A Firebug extension to debug Backbone based applications running off web-browsers.

Understand Backbone application behavior without wading through JavaScript code. Work with application level constructs, pursue what-if exploration and more...

For details on how to download and use the extension, go to http://dhruvaray.github.io/spa-eye/


### Want to build the latest?

1.  Clone the repository
  
    ```sh
    git clone https://github.com/dhruvaray/spa-eye.git
    cd spa-eye
    ```
  
2.  Build

    Using Node.js **(Recommended)**
    ```sh
    node build.js
    ```
    **OR**
    Using Apache Ant
    ```sh
    ant
    ```
    This step will create the `xpi` file in the releases folder.
    
3.  Install the extension from the file and restart Firefox.
 

### How to run FBTest cases?

1.  Create new `dev` (here, name is irrelevant) firefox [profile](http://support.mozilla.org/en-US/kb/profile-manager-create-and-remove-firefox-profiles) if you have not created yet.

2. Install latest(1.12+ Recommended) [Firebug](https://getfirebug.com/)

3. Install latest [FBTest](https://getfirebug.com/releases/fbtest/)

4. Start local http server to serve test files for FBTest:
  ```
  node build.js server <PORT>
  ```
  It will start server at `http://localhost:PORT` (default port is 8888).

5. Run all fbtest cases:
  ```
  node build.js test <PROFILE> <PORT>
  ```
  It will run all fbtests at `http://localhost:PORT` with profile PROFILE (default port is 8888 and profile is 'dev').


For more details:
```
node build.js help
```
