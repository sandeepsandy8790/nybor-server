#!/usr/bin/env node
"use strict";

//module dependencies
var server = require("../dist/server");
var http = require("http");
var https = require("https");
var fs = require("fs");






var port;
var app;
var server;


// spawn the server
CreateHTTPServer();



/**
 * This creates an HTTP Server
 */
function CreateHTTPServer()
{
    port = normalizePort(process.env.PORT || 3080);
    app = server.SrishtiServer.bootstrap().app;
    app.set("port", port);
    server = http.createServer(app);
    server.listen(port);
    BindServerLifecycleEvents();
}

/**
 * This creates an HTTPSServer
 * HTTPS Servers listen on port 8443 mostly
 * HTTPS servers  require a certificate
 * If the certificates are not present it falls backs on HTTP Server
 * IF YOU DONT HAVE A CERTIFICATE USE THIS COMMAND
 * openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365
 */
function CreateHTTPSServer()
{
    try
    {
      var privateKey  = fs.readFileSync(__dirname+'/server.key', 'utf8');
      var certificate = fs.readFileSync(__dirname+'/server.crt', 'utf8');
      var credentials = {key: privateKey, cert: certificate , passphrase: 'dumbledore'};
      port = normalizePort(process.env.PORT || 8443);
      app = server.SrishtiServer.bootstrap().app;
      app.set("port", port);
      server = https.createServer(app);
      server.listen(port);
      BindServerLifecycleEvents();
    }
    catch(error)
    {
      console.log("Failed to create a HTTPS Server :"+error);
      console.log("Instead creating an HTTP Server");
      CreateHTTPSServer();
    }
    
}

/**
 * Just binds the server
 * with its life cycle events
 */

function BindServerLifecycleEvents()
{
  server.on("error", onError);
  //start listening on port
  server.on("listening", onListening);
}


/**
 * HTTP Handler Error
 * @param {*} error 
 */
function onError(error) 
{
  if (error.syscall !== "listen") { throw error;}
  var bind = typeof port === "string" ? "Pipe " + port: "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) 
  {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Housekeeping work
 * when the server is iniitated
 * 
 */
function onListening() 
{
  console.log("Srishti is running on port " + port);
}

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) 
{
  var port = parseInt(val, 10);
  if (isNaN(port)) {  return val;} if (port >= 0) { return port;} return false;
}