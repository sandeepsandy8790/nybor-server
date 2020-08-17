import { IAadhar } from "@modules/aadhars/aadhar.model";
import { IResponse, CrudManager, STATUS } from "@managers/crud.manager";
import { Schema } from 'mongoose';
import { CustomErrors, ErrorPlugin } from "./error.plugin";

const jwt = require('jsonwebtoken');
const shortid = require('shortid');
const OTPAuth = require('otpauth');
var twilio = require('twilio');

export class IOTP {
    id?: string;
    userID?: string;
    otp?: number;
    timeStamp?: Date;
    schemaName = "Otp";
    schema = schemaDefinition;
}

let totp = new OTPAuth.TOTP({
    issuer: 'Srishti',
    label: 'Srishti Forgot Password',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromB32("asasSasasSasassasa")
    //secret: OTPAuth.Secret.fromB32(process.env.otpSecret)
});
export var schemaDefinition: Schema = new Schema({
    id: { type: String, default: shortid.generate, unique: false, required: true },
    userID: { type: String, default: "", unique: false, required: true },
    otp: { type: String, default: "", select: true, unique: true, required: true },
    timeStamp: { type: Date, default: "", select: true, unique: true, required: true }
})

export class OtpPlugin{
    public static async Send_OTP(u: IAadhar): Promise<IResponse> {
        let response: IResponse;
        let o = new IOTP();
        o.userID = u.id;
        console.log(JSON.stringify(u)+"aadhar ")
        response = await CrudManager.Read(o);
        if (response.error == null && response.result.length == 1) {
            let oneTimePassword = totp.generate();
            let x = response.result[0];
            o.id = x.id;
            o.otp = oneTimePassword;
            o.timeStamp = new Date(Date.now());
            response = await CrudManager.Update(o); // Update otp for subsequent requests
            if (response.error == null && response.status == STATUS.OK) {
                response.token=await this.GenerateTemporaryToken(u)
                response.error = null;
                response.status = STATUS.OK;
                response.result = oneTimePassword
                
            }
            else {
                response.token = null; //send token
                response.error = CustomErrors.NO_ACCOUNT;
                response.status = STATUS.IOERROR;
                response.result = null
            }
        }
        else {
            let oneTimePassword = totp.generate();
            o.userID = u.id;
            o.otp = oneTimePassword;
            o.timeStamp = new Date(Date.now());
            response = await CrudManager.Create(o); // Create for first time request
            
            response.token=await this.GenerateTemporaryToken(u)
            response.error = null;
            response.status = STATUS.OK;
            response.result = oneTimePassword
        }
      

        this.SendOtptoMobile(o,u);

        return response;

    }

    public static SendOtptoMobile(o: IOTP, a: IAadhar) {
        console.log('Message OTP Begins');
        let accountSid = 'AC316358391de5c4d60e6a04012db1edeb';
        let authToken = '60ad1354677e5ac081c3daa231e0639e';
 
        var client = new twilio(accountSid, authToken);
        console.log(o.otp)
        console.log(a.mobileNumber)
        client.messages.create({
            body: 'Your OTP is ' + o.otp +  'Do not share your OTP.',
            from: "+12055462958",
            to: '+91' + a.mobileNumber
        }).then((message) => console.log("message sid", message));

        console.log('Message OTP Ends');
 
    }

    public static async Validate_OTP_Mobile(a: IOTP, u:IAadhar,  o: boolean = true): Promise<IResponse> {
        let response: IResponse;
        let array:any=[];
        let x: IOTP = new IOTP();
 
        try {

          
                console.log('User =>=>' + JSON.stringify(u))
                x.userID = a.userID;
                x.otp = a.otp;
                console.log('OTP =>' + JSON.stringify(x));
                response = await CrudManager.Read(x);
            
            if (response.error == null && response.result.length == 1) {
                console.log("OTP was Found");
                if (o) {
                    let o:IAadhar = new IAadhar();
                    o.id = x.userID;
              
                    response.token = await this.GenerateLoginToken(u);
                    response.result= u;
                    response.error = null;
                    response.status = STATUS.OK;
                }
                else {
                    console.log("Temporary token else");
                    response.result = await this.GenerateTemporaryToken(u); 
                }
            }
            else {
                console.error("No Account Was Found");
                response.result = null;
                response.error = CustomErrors.INVALID_OTP;
                response.status = STATUS.AUTHERROR;

            }
        }
        catch (error) {
            console.error("Server Error :" + error);
            response.result = null;
            response.error = ErrorPlugin.SantizeError(error);
            response.status = STATUS.IOERROR;
        }
        return response;
    }

    public static async Validate_OTP_ChangeMobileNUmber(a, u:IAadhar,  o: boolean = true): Promise<IResponse> {
        let response: IResponse;
        let x: IOTP = new IOTP();
 
        try {

          
                console.log('User =>=>' + JSON.stringify(u))
                x.userID = u.id;
                x.otp = a;
                console.log('OTP =>' + JSON.stringify(x));
                response = await CrudManager.Read(x);
            
            if (response.error == null && response.result.length == 1) {
                console.log("OTP was Found");
                if (o) {
                    let o:IAadhar = new IAadhar();
                    o.id = x.userID;
              
                    response.token = await this.GenerateLoginToken(u);
                    response.result= u;
                    response.error = null;
                    response.status = STATUS.OK;
                }
                else {
                    console.log("Temporary token else");
                    response.result = await this.GenerateTemporaryToken(u); 
                }
            }
            else {
                console.error("No Account Was Found");
                response.result = null;
                response.error = CustomErrors.INVALID_OTP;
                response.status = STATUS.AUTHERROR;

            }
        }
        catch (error) {
            console.error("Server Error :" + error);
            response.result = null;
            response.error = ErrorPlugin.SantizeError(error);
            response.status = STATUS.IOERROR;
        }
        return response;
    }
    public static GenerateTemporaryToken(a: IAadhar): string {
        var token = jwt.sign({ id: a.id }, process.env.loginTemporary, { expiresIn: process.env.loginTemporaryLife });
        return token;
    }

    public static GenerateLoginToken(a: IAadhar): string {
        let loginSecret;
        let loginExpiry;

            console.log("Encrypting User Token");
            loginSecret = process.env.loginUser;
            loginExpiry = process.env.loginTokenLife
        

        try {
            console.log("Encrypting :" + JSON.stringify(a));
            var token = jwt.sign({ id: a.id }, loginSecret, { expiresIn: loginExpiry });
            console.log("Token :" + token);
            return token;
        }
        catch (error) {
            console.error("Token Error:" + error);
        }

    }
}