import { Schema, ObjectId } from "mongoose";
import { CrudManager, IResponse, STATUS } from "@managers/crud.manager";
import { ErrorPlugin, CustomErrors } from "./error.plugin";
import { StringPlugin } from "./string.plugin";
// import { IOrderSummary, IPlatform } from "@modules/orders/order.model";

const bcrypt = require('bcryptjs');
const shortid = require('shortid');
const jwt = require('jsonwebtoken');
const OTPAuth = require('otpauth');


let totp = new OTPAuth.TOTP({
    issuer: 'Srishti',
    label: 'Srishti Forgot Password',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret:OTPAuth.Secret.fromB32("asasSasasSasassasa")
    //secret: OTPAuth.Secret.fromB32(process.env.otpSecret)
});



/**
 * This is the Aadhar Identity
 * Interface used for authenticating
 * and authorizing end user to the
 * Srishti Application
 */
export class IUser
{
     id?:string;
     email?:any; 
     password?:any; 
     firstName?:string;
     lastName?:string;
     mobileNumber?:string;
     dateOfBirth?:Date;
     accountCreated?:Date;
     lastActive?:Date;
     previousPasswords?:string[];
     lastEdited?:Date;
     oneTimePassword?:string;
     oneTimePasswordExpiry?:string;
     isActive?:boolean;
     userRole?:IUserRole;
     roleID?:string;
     schemaName = "User"; // this would be the name of your collection in mongoose
     schema = schemaDefinition; //dont change this
}

/**
 * Aadhar Role that controls the
 * authorization
 */
export enum IUserRole
{
    ADMIN=1,
    CLIENT=2,
    USER=3,
    UN_ASSIGNED=-1
}


/**
 * Not all fields in Aadhar would be
 * selected. We however might need to
 * revisit this flag at a later date
 */
export var schemaDefinition: Schema = new Schema(
{
          id: {type: String, default: shortid.generate, unique:true , required:false},
          email:{type: String, default: "" , select:true , unique:true , required:true },  
          // moving select to true becuase bcrypt cant run queries
          // ensure you santize the password before sending to ui
          password:{type: String, default: "" , select:true , unique:true , required:true }, 
          firstName: {type: String, default: "" , select:true , unique:false , required:true}, 
          lastName: {type: String, default: "" , select:true , unique:false, required:false},
          // setting this as unique: false as currently UI doesnt accept mobile but it should be true
          mobileNumber:{type: String, default: "" , select:true , unique:false , required:false},
          dateOfBirth: {type: Date, default: "" , select:true , unique:false, required:false},
          accountCreated: {type: Date, default: Date.now() , select:true , unique:false},
          lastActive:{type: Date, default: Date.now() , select:true , unique:false},
          previousPasswords:{type: Array, default: "" , select:true , unique:false},
          lastEdited:{type: Date, default: Date.now() , select:true , unique:false},
          oneTimePassword:{type: String, default: "" , select:true , unique:false},
          oneTimePasswordExpiry:{type: Date, default: Date.now() , select:true , unique:false},
          isActive:{type: Boolean, default: true , select:true , unique:false},
          userRole:{type: Number, default: 3 , select:true , unique:false , required:false},
});


/**
 * The master class that handles all authentication
 * 
 */
export class UserPlugin
{




    /**
     * This registers a new user account
     * user accounts should have unique email & mobile
     * numbers 
     */
    public static async RegisterUser(a:IUser):Promise<IResponse>
    {
        
        let response:IResponse;
        response = {};
        if(await UserPlugin.ConfirmUniqueEmail(a) &&  await UserPlugin.ConfirmUniqueMobile(a))
        {

            console.log("User Pass");
            if(a.lastName==null)
            {
                let fullname = StringPlugin.splitAt(a.firstName , a.firstName.indexOf(" "));
                a.firstName = fullname[0];
                a.lastName = fullname[1];
            }

            try
            {
                    /**
                     * We cannot use the password from the UI
                     * We hash the pass at this stage. Hashing is one way
                     * BCrypt slows the hashing process & makes it difficult
                     * to geenrate rainbow table which was easier to do in
                     * md5+salt technique. You should still use the rate limiter
                     * to prevent brute force
                     */

                    if(a.password !=null && a.password.length>0)
                    {
                        a.password = bcrypt.hashSync(a.password, 10);
                        a.previousPasswords =  new Array<string>();
                        a.previousPasswords.push(a.password); // store this password
                    }

                    if(a.id==null)
                    {
                        console.log("Creating...");
                        response = await CrudManager.Create(a)
                    }
                    else
                    {
                        console.log("Updating..");
                        response = await CrudManager.Update(a);
                    }

                    if(response.error==null)
                    {
                        response.result = UserPlugin.SanitizeUserTransmission(response.result);
                        await this.SendWelcomeEmail(a); // sends a welcome email
                    }
            }
            catch(error)
            {
                    console.log("User Pass But Fail :"+error);
                    response.error = ErrorPlugin.SantizeError(error);
                    response.result = null;
                    response.status  = STATUS.IOERROR;
            }
            
        }
        else
        {
            console.log("User Fail completely");
            response.error = CustomErrors.REG_NOT_ALLOWED;
            response.result = null;
            response.status  = STATUS.IOERROR;
        }
        return response;
    }



 
    /**
     * It is a simple login procedure
     * verify the username and password
     * @param a 
     */
    public static async LoginAadhar(a:IUser):Promise<IResponse>
    {
        let response:IResponse;
       try
       {
            // get aadhar by email
            let x: IUser =  new IUser(); 
            x.email = a.email;  
            response = await CrudManager.Read(x);
            if(response.error==null && response.result.length==1)
            {
                x =  response.result[0];
                if(bcrypt.compareSync(a.password, x.password))
                {
                    if(x.isActive==true && x.userRole!=IUserRole.UN_ASSIGNED)
                    {
                        // we now have to update the last active
                        let o = new IUser();
                        o.id = x.id;
                        o.lastActive = new Date(Date.now());
                        await CrudManager.Update(o);
                        // Passwords match
                        response.result = await this.GenerateLoginToken(x); //send token
                        response.error = null;
                        response.status =  STATUS.OK;
                    }
                    else
                    {
                        console.error("User Not Active");
                        // Passwords don't match // we dont tell the users what went wrong
                        response.result = null;
                        response.error = CustomErrors.USER_NOT_ACTIVE;
                        response.status =  STATUS.AUTHERROR;
                    }
                    
                } 
                else 
                {
                    console.error("Password didnot match and login failed");
                    // Passwords don't match // we dont tell the users what went wrong
                    response.result = null;
                    response.error = CustomErrors.LOGIN_FAILED;
                    response.status =  STATUS.AUTHERROR;
                }
            }
            else
            {
                console.error("No Account Was Found");
                response.result = null;
                response.error = CustomErrors.NO_ACCOUNT;
                response.status =  STATUS.AUTHERROR;

            }
       }
       catch(error)
       {
            console.error("Server Error :"+error);
            response.result = null;
            response.error =  ErrorPlugin.SantizeError(error);
            response.status = STATUS.IOERROR;
       }
        
       
       
        return response;
    }

    /**
     * Checks if a valid email or mobile number is provided
     * Send and SMS or an Email as OTP
     * Once the user enters an identifier
     * we set a temporary session to authenticate
     * OTP need to be entered during this session
     * @param a 
     */
    public static async InitiateForgotPassword(a:IUser):Promise<IResponse>
    {
        let response:IResponse;
        try
        {
            // get aadhar by email
            let x: IUser = new IUser(); x.email = a.email;  

           
            response = await CrudManager.Read(x);
            if(response.error==null && response.result.length==1)
            {
                x  = response.result[0];

                //generate OTP
                a.oneTimePassword = totp.generate();
                console.log("OTP:"+a.oneTimePassword);
                // let us now update
                let o:IUser =  new IUser();
                o.id = x.id;
                o.oneTimePassword = a.oneTimePassword;
                await CrudManager.Update(o);
                // send OTP email
                await this.SendForgotPasswordEmail(a);
                response.result = this.GenerateTemporaryToken(o);
            }  
            else
            {
                response.result = null;
                response.error = CustomErrors.NO_ACCOUNT;
                response.status = STATUS.IOERROR;
            }  
        }
        catch(error)
        {
                console.log("Error :"+error);
                response.error = ErrorPlugin.SantizeError(error);
                response.result = null;
                response.status  = STATUS.IOERROR;
        }

        return response;
        
    }

    /**
     * The Middleware must have authenticated the temporary token
     * We need to verify the OTP
     * @param a 
     */
    public static async RedeemForgotPassword(a:IUser):Promise<IResponse>
    {
        let response:IResponse;
        try
        {
            
            // get aadhar by email
            let x: IUser = new IUser(); x.email = a.email;    
            response = await CrudManager.Read(x);
            if(response.error==null && response.result.length==1)
            {
                x = response.result[0];
                /**
                 * First level of defence is to check if the OTP
                 * is valid as per our encrypted authentication
                 * Secondly we check if the two OTPs are  equal
                 */

                 
                
                 console.log("Validation Delta :"+totp.validate({token:a.oneTimePassword}));

                if(a.oneTimePassword == x.oneTimePassword)
                {
                
                    let o = new IUser();
                    o.id = x.id; 
                    o.previousPasswords = x.previousPasswords;
                    o.password = bcrypt.hashSync(a.password, 10);

                    

                    //o.previousPasswords.push(x.password); // store old  password
                    response = await CrudManager.Update(o);


                    console.log("Santizing & Sending Back to UI");
                    response.result = this.SanitizeUserTransmission(x);
                    console.log("Received Sanitzed");
                    await this.SendPasswordChangedEmail(x);
                }
                else
                {
                    response.result = null;
                    response.error = CustomErrors.INVALID_OTP;
                    response.status = STATUS.AUTHERROR;
                }
            }  
            else
            {
                response.result = null;
                response.error = CustomErrors.NO_ACCOUNT;
                response.status = STATUS.IOERROR;
            }  
        }
        catch(error)
        {
                console.log("Error :"+error);
                response.error = ErrorPlugin.SantizeError(error);
                response.result = null;
                response.status  = STATUS.IOERROR;
        }

        return response; 
    }


    /**
     * Approves an email
     * Should be used only by an admin
     * @param a 
     */
    private static async ApproveEmailForLogin(a:IUser) : Promise<IResponse>
    {
        a.isActive = true;
        return CrudManager.Update(a);
    }


    private static SendWelcomeEmail(a:IUser)
    {
        return;
    }

    private static SendForgotPasswordEmail(a:IUser)
    {
        return;
    }

    private static SendPasswordChangedEmail(a:IUser)
    {
        return;
    }

    /**
     * This checks if any user is present
     * in the database with the same email
     * @param a this checks if any user
     */
    private static async ConfirmUniqueEmail(a:IUser):Promise<Boolean>
    {
       /**
        * Extract only the email field
        * if you send the whole object the combination
        * may not yeild the desired results
        */
       if(a.email!=null)
       {
            let x: IUser =  new IUser();
            x.email = a.email; 
            x.id = a.id;
            let response:IResponse = await CrudManager.Read(x);
            if(response.result==null || response.result.length==0) return true;else 
            {
                if(a.id==null) return false; else return true;
                
            }
       }
       else
       {
           return true;
       }
        
    }

    private static async ConfirmUniqueMobile(a:IUser)
    {
        /**
        * Extract only the email field
        * if you send the whole object the combination
        * may not yeild the desired results
        */
       if(a.mobileNumber!=null)
       {
            let x: IUser = new IUser();
            x.mobileNumber = a.mobileNumber; 
            x.id = a.id;
            let response:IResponse = await CrudManager.Read(x)
            if(response.result==null || response.result.length==0) return true;else 
            {
                if(a.id==null) return false; else return true;
                
            }
       }
       else
       {
           return true;
       }
       
    }

   

    /**
     * Generates a JWT Token
     * This JWT Token holds some
     * Identitiy characteristic of the Aadhar
     * @param 
     */
    private static GenerateLoginToken(a:IUser):string
    {
        let loginSecret;
        let loginExpiry;

        console.log("Role :"+a.userRole);
        

        if(a.userRole == IUserRole.ADMIN)
        {
            console.log("Envrypting Admin Token");
            loginSecret = process.env.loginAdmin;
            loginExpiry = process.env.loginTokenLife
        }
        else if(a.userRole == IUserRole.CLIENT)
        {
            console.log("Envrypting Client Token");
            loginSecret = process.env.loginClient;
            loginExpiry = process.env.loginTokenLife
        }
        else
        {
            console.log("Envrypting User Token");
            loginSecret = process.env.loginUser;
            loginExpiry = process.env.loginTokenLife
        }

        try
        {
            console.log("Encrypting :"+JSON.stringify(a));
            var token = jwt.sign({ id: a.id }, loginSecret, { expiresIn: loginExpiry });
            console.log("Token :"+token);
            return token;
        }
        catch(error)
        {
            console.error("Token Error:"+error);
        }
        
    }

    /**
     * Generates a JWT Token
     * This is a TEMPORARY TOKEN
     * REQUIRED TO IDENTIFY THE INCOMING REQUEST
     * @param 
     */
    private static GenerateTemporaryToken(a:IUser):string
    {
        var token = jwt.sign({id: a.id}, process.env.loginTemporary, { expiresIn: process.env.loginTemporaryLife });
        return token;
    }


    /**
     * Not every information needs to be sent to
     * UI. We should santize the information received
     * @param a
     */
    public static SanitizeUserTransmission(a)
    {
        a.password = undefined;
        a.mobileNumber= undefined;
        a.email= undefined;
        a.previousPasswords= undefined;
        a.oneTimePassword= undefined;
        a.oneTimePasswordExpiry= undefined;
        a._id= undefined;
        a.schema = null;
        a.schemaDefinition = null;
        return a;
    }



}