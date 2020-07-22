import mongoose = require("mongoose");



export class DatabaseManager
{

    public static connection: mongoose.Connection;
   
    

    /**
     * This function is a wrapper
     * to connect to the database.It abstracts
     * the complexity of connection handling from
     * the rest of the app. Feel free to use
     * any of the available adapters below
     */
    public static connect()
    {  
        try
        {
            if(this.connection==null) 
            { 
                 return this.MongoCluster();
               // return this.StandaloneDatabase();
            }
            else{ return this.connection;}
        }
        catch(error)
        {
            console.log("Database Error :"+error);
        }
    }

    /**
     * This adapter is useful for creating
     * a connection with a shared cluster
     * database like Atlas
     */
    private static MongoCluster()
    {
        try
        {
            var dbURI="mongodb+srv://Sandeep:sandy123@sandeep.xsiqi.mongodb.net/test"
            //var dbURI = "mongodb://"+process.env.dbUser+":"+process.env.dbPassword+"@"+process.env.dbClusterAddress+"/"+process.env.dbName+"?retryWrites=true";
            console.log("Connection String :"+dbURI);
            this.connection = mongoose.createConnection(dbURI);
            this.BindConnectionEvents();
            return this.connection;
        }
        catch(error)
        {
            console.log("Error :"+error);
        }
        
    }

    /**
     * Adapter for Standalone Database Connection
     * Srishti uses Mongoose ODM for securely
     * managing its communication with database
     */
    private static StandaloneDatabase()
    {   
        var dbURI = "mongodb://"+process.env.dbHost+"/"+process.env.dbName;
        console.log("Connection String :"+dbURI); 
        this.connection = mongoose.createConnection(dbURI);
        this.BindConnectionEvents();
        return this.connection;
    }

    

    /**
     * This function allows you to perform
     * housekeeping work based on connection
     * status your mongo db. This also closes
     * any open connection if Node JS
     * has initiated a shutdown.
     */
    private static BindConnectionEvents()
    {
        
        // When successfully connected
        mongoose.connection.on('connected', function () 
        {  
            console.log("Connection Successful");
        }); 

        // If the connection throws an error
        mongoose.connection.on('error',function (err) 
        {  
            console.log("Error :"+err);
            
        }); 

        // When the connection is disconnected
        mongoose.connection.on('disconnected', function () 
        {  
            console.log("Mongoose Connection Disconnected");
        });

        // If the Node process ends, close the Mongoose connection 
        process.on('SIGINT', function() 
        {  
            console.log("Node Exited and Hence Mongoose Connection Was Disconnected");
            mongoose.connection.close(function () {  process.exit(0); }); 
        }); 
    }


   


}
