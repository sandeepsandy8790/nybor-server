
var _ = require('underscore');


/**
 * Srishti Plugin for parsing Mongoose Schema
 * This plugin performs a simple reflection on
 * one object to match its structure with a known
 * schema type. Useful for interpretating the
 * incoming object from UI.
 */
export class SchemaParser
{
    
    // adding support to default argument
    static defaultArgument (argument,callback)
    {
        typeof(argument)==='undefined' ? callback("") :  callback(argument);
    }

  
         /**
         * This is how we parse an incoming object
         * Incoming objects are passed as JSON strings
         * SchemaParser converts this to the type you are expecting
         * This reduces your effort to manually parse and check the incoming object
         * Also it assures you that the object is structured the same type you want
         */

    /// removes manual parsing of an request object
    /// doc: empty object of type you want
    /// SchemaTarget: reference to the type 
    /// req: actual req received by the browser
    static  async parseRequest(doc,SchemaTarget,req)
    {
        for (var field in SchemaTarget.schema.paths)
        {
            if (field !== '__v')
            {
                // get the object value
                var newValue = await this.getObjValue(field,req);
                if (newValue !== undefined) 
                {
                    await this.setObjValue(field,doc,newValue);
                }      
            }
        } 
        return doc;
    }

    //// updates the whole document
    /// doc: old object
    /// SchemaTarget: reference to the type
    /// data: new information received
    static async updateDocument (_old, SchemaTarget, _new)
    {
       
        for (var field in SchemaTarget.schema.paths)
        {
            if ((field !== '_id') && (field !== '__v') && (field!=='id'))
            {
                // get the object value
                    var newValue =  await this.getObjValue(field, _new);
                    if (newValue !== undefined) 
                    {
                        await this.setObjValue(field, _old, newValue);
                    }       
            }
        } 

        //console.log("Wrapping up");
        return _new;
    };

    static findWord  (s, word , callback){ callback(new RegExp( '\\b' + word + '\\b', 'i').test(s));}


    //private function
    public static  getObjValue(field, data) 
    {
        return( _.reduce(field.split("."), function(obj, f) { 
                if(obj) return obj[f];
        }, data));
        
    }

    //private function
    public static  setObjValue(field, data, value) {
    var fieldArr = field.split('.');
    return ( _.reduce(fieldArr, function(o, f, i) {
        if(i == fieldArr.length-1) {
            o[f] = value;
        } else {
            if(!o[f]) o[f] = {};
        }
        return o[f];
    }, data));
    }
}