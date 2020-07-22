import { NextFunction, Request, Response, Router } from "express";
import { CrudManager } from "@managers/crud.manager";
import { SchemaParser } from "@plugins/schemaparser.plugin";
  
  /**
     * This parses the incoming object
     * to type IAdmin. This will only work if
     * you have the same object signature in your front end.
     * Srishti reccommends copy pasting the models from
     * here and consuming them in your UI
     */

    export class RequestMiddleware
    {

        /**
         * Slightly modifying the middleware signature
         * it can now accept parameters and returns a
         * next() function
         */
        public static async Parse(a)
        {
            console.log("Request in middleware XOXO");
            return async function(req, res, next) 
            {   
                try
                {
                    console.log("Request in middleware XOXO");
                   // let schema = await CrudManager.Bootstrap(a);
                    //a = await SchemaParser.parseRequest(a,schema,req.body);
                    //req.body.app = a;
                    next();
                }
                catch(error)
                {
                    res.status(401).send({ message: error });
                }
            }
        }
    }
     