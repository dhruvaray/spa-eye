/* See license.txt for terms of usage */

// ********************************************************************************************* //
// Author: Jan Odvarko, odvarko@gmail.com
//
// Use this file together with mainOverlay.xul that loads the entire extension. This file
// can be used as is, the only thing you need to provide is unique "extensionName" <ext-name>
//
// Search for <ext-name> keyword thourough this extension and replace by unique ID.
//
// Content of the mainOverlay.xul overlay should look like as follows:
//
// <?xml version="1.0"?>
// <overlay xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">
//    <script type="application/x-javascript" src="chrome://<ext-name>/content/mainOverlay.js"/>
// </overlay>
//
// The mainOverlay.xul file is used only to load the extension. The loading proces can be
// also done through bootstrap.js (restartless Firefox support), but it needs additional
// Firebug APIs support.
//
// Do not use XUL for any UI (you wouldn't be able to use restartless add-on support later).
// Firebug UI should be extended only through Firebug related API.

// ********************************************************************************************* //
// Registration

// Notice that <ext-name> is used to build chrome paths like: chrome://<ext-name>/content/main.js
// The <ext-name> should comd from chrome.manifest: resource spa-eye chrome/

// The registration process will automatically look for 'main' module and load it.
var config = {id: "spa_eye@dhruvaray.github.com"};
Firebug.registerExtension("spa_eye", config);

// Register trace listener the customizes trace logs coming from this extension
// * SPA-eye; is unique prefix of all messages that should be customized.
// * DBG_SPA-eye is a class name with style defined in the specified stylesheet.
Firebug.registerTracePrefix("spa_eye;", "DBG_SPA_EYE", true,
    "chrome://spa_eye/skin/spa_eye.css");

// ********************************************************************************************* //
