#!/usr/bin/env node
"use strict";

require('module-alias/register');


import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as logger from "morgan";

import errorHandler = require("errorhandler");
import methodOverride = require("method-override");
import mongoose = require("mongoose"); //import mongoose
import {RouteManager} from "@managers/route.manager";

import * as multer from 'multer';
import { NextFunction, Request, Response, Router } from "express";
import { DIRECTORIES } from "@modules/directories/directories.model";
var fs = require('fs');


const path = require("path");
var favicon=require('serve-favicon')
require('dotenv').config({ path:  path.join(__dirname, "config/dev.env")} );

/* implementing redis cache */
//var redis = require('ioredis');
//var MongooseRedis = require('mongoose-with-redis');
//var redisClient = redis.createClient();
var cacheOptions =
{
  cache: false,
  expires: 60,
  prefix: 'RedisCache'
};

/* implementing LUSCA */
var session = require('express-session');
var lusca = require('lusca');
var http = require('http');

/**
 * The Srishti Application Server
 * This would hold our amazing API
 * Centralized Security
 * Centralized Error Handling
 * Cache Options
 * Route Config
 */
export class SrishtiServer
{

    public app: express.Application;
    public static bootstrap(): SrishtiServer { return new SrishtiServer(); }


    constructor() 
    {
      
      console.log("Srishti Version:"+process.env.srishtiVersion);
      this.app = express();
      this.config();
      this.enableCORS();
      this.routes();    
    }


  private async Initialize()
  {
   
  }



  private enableCORS() {
    this.app.use(function (req, res, next) 
    {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With");
      res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
      if ('OPTIONS' === req.method) { res.status(204).send(); }
      else { next(); }
    });
  }



  public config() {
    this.general()
    this.bodyparser();
    this.redis();
    this.lusca();
    this.mongoose();


    this.app.use(function (err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
      err.status = 404;
      next(err);
    });
    //error handling
    this.app.use(errorHandler());
  }


  // general settings
  private general() {

    for (let i = 0; i < DIRECTORIES.length; i++) {
      if (!fs.existsSync(path.join(__dirname, DIRECTORIES[i]))) {
        fs.mkdirSync(path.join(__dirname, DIRECTORIES[i]));
      }
    }
    this.app.use(logger("dev"));
    //this.app.use(express.static("uploads"));
    //console.log("Passing :"+__dirname);
    this.app.use(express.static(path.join(__dirname, "../uploads")));
    this.app.use(express.static(path.join(__dirname, "../uploads/kycDocuments")));
    
    /* 
    It's Given a Error thats reason to commented below line 
    */
    // this.app.use(favicon(path.join(__dirname,  'public', 'favicon.ico'))) 
    // heroku test  
     




  }

  private bodyparser() {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    //this.app.use(cookieParser(AppConfig.secretKey));
    this.app.use(methodOverride());
  }

  private redis() {
    // MongooseRedis(mongoose, redisClient, cacheOptions);
  }


  private lusca() {

    //this.app.use(session({ secret: AppConfig.secretKey, resave: true, saveUninitialized: true }));
    this.app.use(lusca({
      csrf: false,
      csp: { policy: { 'default-src': '*' } },
      xframe: 'SAMEORIGIN',
      p3p: 'ABCDEF',
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      xssProtection: true,
      nosniff: true
    }));
  }


  private mongoose() {

    global.Promise = require("q").Promise;
    mongoose.Promise = global.Promise;
    mongoose.set('debug', true);
  }

  public  cache(a,b)
    {
            
            return (req, res, next) => 
            {
                next();
            }
    }


  private async routes() 
  {
    let router: express.Router;
    router = express.Router();
    RouteManager.CreateRouter(router); 
    this.app.set('views', path.join(__dirname, 'views'));
    this.app.set('view engine', 'pug');
    
    this.app.use(router);

    /* Global Try Catch */
    this.app.use(function(err, req, res, next) {
      console.log("Global Error :"+err);
    });


    this.app.use(express.static(path.join(__dirname, 'public')));
  }
    

  



}