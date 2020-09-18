import { IAdmin } from "@modules/admin/admin.model";
import { IResponse, CrudManager, STATUS } from "@managers/crud.manager";
import { ErrorPlugin, CustomErrors } from "./error.plugin";
import { OtpPlugin } from "./otp.plugin";


const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
export class AdminPlugin {


    public static async RegisterAdmin(a: IAdmin): Promise<IResponse> {

        let response: IResponse;
        response = {};
        console.log("Admin register plugin");


        try {
            /**
             * We cannot use the password from the UI
             * We hash the pass at this stage. Hashing is one way
             * BCrypt slows the hashing process & makes it difficult
             * to geenrate rainbow table which was easier to do in
             * md5+salt technique. You should still use the rate limiter
             * to prevent brute force
             */

            if (a.password != null && a.password.length > 0) {
                a.password = bcrypt.hashSync(a.password, 10);

            }

            if (a.id == null) {
                console.log("Creating...");
                response = await CrudManager.Create(a)

            }
            else {
                console.log("Updating..");
                response = await CrudManager.Update(a);
            }
            console.log(JSON.stringify(response)+"creation / updation responseee")
            if (response.status == STATUS.OK && response.error == null) {
                console.log("creation done")
                response.result = response.result;
                response.status = STATUS.OK;
                response.error = null;
             
            }
            else{
                console.log("creation failed")
                response.result = null;
                response.status = STATUS.IOERROR;
            }
        }
        catch (error) {
            console.log("User Pass But Fail :" + error);
            response.error = ErrorPlugin.SantizeError(error);
            response.result = null;
            response.status = STATUS.IOERROR;
        }



        return response;
    }


    public static async AdminLogin(a: IAdmin): Promise<IResponse> {
        let response: IResponse;
        response = {};

        let x:IAdmin=new IAdmin();
        x.email=a.email;
        response=await CrudManager.Read(x);
        if(response.result.length===1 && response.error==null){
            console.log("account found")
            x=response.result[0];
            if (bcrypt.compareSync(a.password, x.password)) {
                console.log("password matched")
                let s = new IAdmin();
                s.id = x.id;
                s.lastActive = new Date(Date.now());
                let r = await CrudManager.Update(s);
                if(r.status==STATUS.OK && r.error==null){
                    response.result=response.result;
                    response.status=STATUS.OK;
                    response.token=await this.GenerateLoginToken(a);
                }
            }
            else{
                console.error("Password didnot match and login failed");
                response.result = null;
                response.error = CustomErrors.LOGIN_FAILED;
                response.status = STATUS.AUTHERROR;
            }

        }
        else{
            console.error("No Account Was Found");
            response.result = null;
            response.error = CustomErrors.NO_ACCOUNT;
            response.status = STATUS.IOERROR;
        }

        return response;
    }

    public static GenerateLoginToken(a: IAdmin): string {
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