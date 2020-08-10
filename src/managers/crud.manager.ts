/* CRUD HELPERS FOR THE MODEL  */

import mongoose = require("mongoose"); //import mongoose
import {DatabaseManager } from "@managers/database.manager";
import { SchemaParser } from "@plugins/schemaparser.plugin";




export interface IResponse
{
    result?; // deliberately left un assigned to hold mongo cursor
    status?:STATUS;
    error?:string;
    token?:string;
}

export enum STATUS
{
    OK,
    IOERROR,
    AUTHERROR,
    ZERO,
    ROLE_UNASSIGNED,
}

/** 
 * Crud Manager manages all the CRUD operations
 * of Srishti Models. Instead of having
 * seperate Crud files for each model. Srishti
 * brings a centralized manager that manages all
 * the CRUD operations.
 * @class
 */

export class CrudManager
{
    
    private static connection: mongoose.Connection;
    public  static mongooseModel:mongoose.Model<any>;
    private static model;
    private static crudResponse:IResponse;
    
    /**
     * This function performs a host of housekeeping operations
     * It initiates a connection with database
     * Then registers a schema for the model that we have asked for
     * Registering a scheme returns me a reference to the model
     * this reference to the model is used for all IO work
     * @param model Srishti Model for whom the CRUD operations
     */
    static async Bootstrap(model) 
    { 
            
            try
            {   
                this.model = model; 
                this.connection  = DatabaseManager.connect();
                this.mongooseModel = this.connection.model<any>(this.model.schemaName, this.model.schema);

                //console.log(JSON.stringify(this.mongooseModel));

                return this.mongooseModel;
            }
            catch(error)
            {
                console.log("Bootstrap Error -------> :"+error);
            }
            
    }

    /**
     * when you store the schema defintion in model signature
     * the schema definition gets copied in every object. This interfers
     * with your Read & Update Queries. As we don't need them here
     * we will reset them
     * @param a : footprint
     */
    public static RemoveSchemaFootprint(a)
    {   
        console.log("Removing Schema...");
        a.schemaName = null;
        a.schema = null;
        return a;
    }

    /**
     * CREATE OPERATION
     * @param data :  Expects the same model that needs insertion
     */
    public static async Create(data):Promise<IResponse>
    {   
       

        this.crudResponse = {};
        await this.Bootstrap(data);
        data = this.RemoveSchemaFootprint(data);

        try
        {
           
            let results = await this.mongooseModel.create(data);
            await results.save();
            this.crudResponse.result = results;
            this.crudResponse.status = STATUS.OK;
            this.crudResponse.error = null;
        }
        catch(error)
        {
            console.log("Error"+error);
            this.crudResponse.result = null;
            this.crudResponse.status = STATUS.IOERROR;
            this.crudResponse.error = error;
        }
        return this.crudResponse;
    }

    /**
     * READ OPERATION
     * By default we read everything
     * if data has no property then we just use to identify whcih collection to query
     * If you supply properties to data then it will try to search those parameters
     * If you set isOne as true , you need to supply an ID
     * @param data :  Expects the same model signature to perform a lookup
     * @param isOne : Searches by ID and hence returns only one unique item
     */
    public static async Read(data, isOne:boolean = false):Promise<IResponse>
    {   
        this.crudResponse = {};
        await this.Bootstrap(data);
        data = this.RemoveSchemaFootprint(data);

       


        try
        {   
            let results;

            //console.log(JSON.stringify(this.mongooseModel));

            if(isOne && data.id!=null)
            {
                results  = await this.mongooseModel.findOne({id:data.id}).exec();
            }
            else if(!isOne)
            {
                results = await this.mongooseModel.find(data).exec();
            }
            else { throw ("ID Not Available");}


        

            this.crudResponse.result = results;
            this.crudResponse.status = STATUS.OK;
            this.crudResponse.error = null;
            
        }
        catch(error)
        {
            console.log("CRUD Error :"+error);
            console.error("You may want to create a new object of your model");
            console.error("And copy the variables as Srishti removes the scehema information");
            this.crudResponse.result = null;
            this.crudResponse.status = STATUS.IOERROR;
            this.crudResponse.error = error;
        }
        return this.crudResponse;
    }

    /**
     * UPDATE OPERATION
     * NEED the ID to perform an update
     * Using the schema parser plugin we will copy only the changed values
     * and copy them to the old object and save the updated copy
     * @param data : model signature
     */
    public static async Update(data):Promise<IResponse>
    {   
       

        this.crudResponse = {};
        //await this.Bootstrap(data);
        //data = this.RemoveSchemaFootprint(data); //If you use this schema wont be registered
        try
        {
            let lookup:IResponse =  await this.Read(data,true);
           
            if(!lookup.error)
            {
                console.log("******** UPDATING **********");
                // this will copy the revised values
               

                await SchemaParser.updateDocument(lookup.result,this.mongooseModel,data);
                //fire the update query
                await lookup.result.save();
                this.crudResponse.result = lookup.result;
                this.crudResponse.status = STATUS.OK;
                this.crudResponse.error = null;
            }
            else
            {
                this.crudResponse.result = null;
                this.crudResponse.status = STATUS.IOERROR;
                this.crudResponse.error = lookup.error;
            }
        }
        catch(error)
        {
                console.log("CRUD Error :"+error);
                console.error("You may want to create a new object of your model");
                console.error("And copy the variables as Srishti removes the scehema information");
                this.crudResponse.result = null;
                this.crudResponse.status = STATUS.IOERROR;
                this.crudResponse.error = error;
        }
        return this.crudResponse;
        
    }
    public static async UpdateOne(data): Promise<IResponse> {
        this.crudResponse = {};
        await this.Bootstrap(data);
        data = this.RemoveSchemaFootprint(data);
    
        try {
          let results;
          results = await this.mongooseModel.update({ id: data.id }, data).exec();
          this.crudResponse.result = results;
          this.crudResponse.status = STATUS.OK;
          this.crudResponse.error = null;
        } catch (error) {
          console.log("CRUD Error :" + error);
          console.error("You may want to create a new object of your model");
          console.error("And copy the variables as Srishti removes the scehema information");
          this.crudResponse.result = null;
          this.crudResponse.status = STATUS.IOERROR;
          this.crudResponse.error = error;
        }
    
        return this.crudResponse;
      }
    public static async Delete(data)
    {
            this.crudResponse = {};
            //await this.Bootstrap(data);
            data = this.RemoveSchemaFootprint(data);
            try
            {   
                let results
                if(data.id!=null)
                {
                    results  = await this.mongooseModel.remove({id:data.id}).exec();
                }
                else { throw ("ID Not Available");}
                this.crudResponse.result = results;
                this.crudResponse.status = STATUS.OK;
                this.crudResponse.error = null;
            }
            catch(error)
            {
                console.log("CRUD Error :"+error);
                console.error("You may want to create a new object of your model");
                console.error("And copy the variables as Srishti removes the scehema information");
                this.crudResponse.result = null;
                this.crudResponse.status = STATUS.IOERROR;
                this.crudResponse.error = error;
            }
            return this.crudResponse;
    }


    /**
     * READ OPERATION
     * By default we read everything
     * if data has no property then we just use to identify whcih collection to query
     * If you supply properties to data then it will try to search those parameters
     * If you set isOne as true , you need to supply an ID
     * @param data :  Expects the same model signature to perform a lookup
     * @param isOne : Searches by ID and hence returns only one unique item
     */
    public static async ReadByFirstLetter(data, firstLetter:string , property:string):Promise<IResponse>
    {   
        this.crudResponse = {};
        await this.Bootstrap(data);
        data = this.RemoveSchemaFootprint(data);
        try
        {   
            let p = property;
            let results = await this.mongooseModel.find({ p: {$regex: '^' + firstLetter}, $options: data });
           
            this.crudResponse.result = results;
            this.crudResponse.status = STATUS.OK;
            this.crudResponse.error = null;
            
        }
        catch(error)
        {
            console.log("CRUD Error :"+error);
            console.error("You may want to create a new object of your model");
            console.error("And copy the variables as Srishti removes the scehema information");
            this.crudResponse.result = null;
            this.crudResponse.status = STATUS.IOERROR;
            this.crudResponse.error = error;
        }
        return this.crudResponse;
    }





   
  

}

