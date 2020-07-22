/**
 * Srishti Plugin for auto generating models and apis
 * This plugin creates a sample model and its associated api
 * Reccommend using this to leverage Srishti's integration
 * If you dont like using this plugin you have to 
 * manually create the model and routes. Ensure you follow
 * the same format
 */

var p = require('prompt');
var manager_template:string ="";
var fs = require("fs");
var path = require("path");
var sugar = require("sugar");
var Handlebars = require("handlebars");



    console.log("**** Welcome to Srishti Unframework *****");
    console.log("**** We will auto generate your module *****");
    console.log("**** Using this saves 30ms of your life & avoids a lot of error *****");

    console.log("\n\n\n **** Don't enter ID as a property. It is automatically added *****");

    p.start();

    p.get(['moduleName', 'property1', 'property2', 'property3', 'property4', 'property5'], function (err, result) 
    {
        
            GenerateModel(result);
            GenerateAPI(result);
            GenerateBusiness(result);
    });




    /**
     * This generates a handlebar template
     * Which will create our Srishti Module
     */
    function GenerateModel(result)
    {
        try
            {   
                console.log("Attempting Model Creation");
                let data:any = {};
                data.interface = "I"+sugar.String.capitalize(result.moduleName);
                data.model = result.moduleName.toLowerCase();
                data.routerName = sugar.String.capitalize(result.moduleName);

                data.property1 = result.property1;
                data.property2 = result.property2;
                data.property3 = result.property3;
                data.property4 = result.property4;
                data.property5 = result.property5;

                let source = fs.readFileSync(path.join(__dirname,  "../handlebars/framework/" , "model.tpl"));
                let template = Handlebars.compile(source.toString());
                let model_result = template({data: data});
                let destination = path.join(__dirname,  "../modules/"+result.moduleName.toLowerCase() , result.moduleName.toLowerCase()+".model.ts");
                fs.mkdirSync(path.join(__dirname,  "../modules/"+result.moduleName.toLowerCase()));
                fs.writeFileSync(destination, model_result);
            }
            catch(error)
            {
                console.log("Error :"+error);
            }
    }


    /**
     * This generates a Srishti API Construct
     * Which will create our Srishti Module
     */
    function GenerateAPI(result)
    {
            try
            {   
                console.log("Attempting API Creation");
                let data:any = {};
                data.interface = "I"+sugar.String.capitalize(result.moduleName);
                data.model = result.moduleName.toLowerCase();
                data.routerName = sugar.String.capitalize(result.moduleName);
                let source = fs.readFileSync(path.join(__dirname,  "../handlebars/framework/" , "route.tpl"));
                let template = Handlebars.compile(source.toString());
                let model_result = template({data: data});
                let destination = path.join(__dirname,  "../routes/" , result.moduleName.toLowerCase()+".api.ts");
                fs.writeFileSync(destination, model_result);
            }
            catch(error)
            {
                console.log("Error :"+error);
            }
    }

     /**
     * This generates a Srishti API Construct
     * Which will create our Srishti Module
     */
    function GenerateBusiness(result)
    {
            try
            {   
                console.log("Attempting Business Layer Creation");
                let data:any = {};
                data.interface = "I"+sugar.String.capitalize(result.moduleName);
                data.model = result.moduleName.toLowerCase();
                data.routerName = sugar.String.capitalize(result.moduleName);
                let source = fs.readFileSync(path.join(__dirname,  "../handlebars/framework/" , "business.tpl"));
                let template = Handlebars.compile(source.toString());
                let model_result = template({data: data});
                let destination = path.join(__dirname,  "../modules/"+result.moduleName.toLowerCase() , result.moduleName.toLowerCase()+".business.ts");
                fs.writeFileSync(destination, model_result);
            }
            catch(error)
            {
                console.log("Error :"+error);
            }
    }