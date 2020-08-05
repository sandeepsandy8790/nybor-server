import { Router } from "express";
import { CrudManager, IResponse, STATUS } from "@managers/crud.manager";
import { SchemaParser } from "@plugins/schemaparser.plugin";
import { IUser, IUserRole, UserPlugin } from "@plugins/user.plugin";
import { Authorization } from "@middleware/authorization";
import { CustomErrors } from "@plugins/error.plugin";
import { Authentication } from "@middleware/authentication";
import { IAadhar } from "@modules/aadhars/aadhar.model";
import { OtpPlugin, IOTP } from "@plugins/otp.plugin";

export class AadharRoutes {
  /**
   * Converts every incoming object
   * into a probable Aadhar Object
   * @param req
   * @param res
   * @param next
   */
  private static async AadharParser(req, res, next) {
    try {
      let a: IAadhar = new IAadhar();
      let schema = await CrudManager.Bootstrap(a);
      /**
       * Authorization Middlewares will set the Aadhar user
       * in some cases. This will conflict with the schema parse
       * So while parsing user received data, we will remove this and
       * re atatch it later
       */
      let payload = req.body;
      req.body.payload = null;
      a = await SchemaParser.parseRequest(a, schema, req.body);
      req.body.app = a;
      req.body.payload = payload; //attach it again
      next();
    } catch (error) {
      res.status(501).send({ message: error });
    }
  }

  private static async OTPParser(req, res, next) {

    try {
        let a: IOTP = new IOTP();
        let schema = await CrudManager.Bootstrap(a);
        /**
         * Authorization Middlewares will set the Aadhar user
         * in some cases. This will conflict with the schema parse
         * So while parsing user received data, we will remove this and 
         * re atatch it later
         */
        let payload = req.body;
        req.body.payload = null;
        console.log('********' + JSON.stringify(req.body) + '**********'); // JSON from UI 
        a = await SchemaParser.parseRequest(a, schema, req.body);
        req.body.app = a;
        req.body.payload = payload; //attach it again
        next();
    }
    catch (error) {
        res.status(501).send({ message: error });
    }

}

  public static async create(router: Router) {
    const EnsureAuth = Authentication.EnsureAuth;
    const EnsureTemporaryLogin = Authorization.EnsureTemporaryLogin;
    const ExtractAadhar = Authentication.ExtractAadharCard;
    const OTPParser=this.OTPParser;
    const EnsureUserLogin = Authorization.EnsureUserLogin;
    /**
     * THIS IS A COMMON LOGIN ROUTE
     * SUCCESSFUL LOGIN DOESN'T GAURENTEE YOU ACCESS
     * ACCESS CONTROL IS GOVERNED BY THE TOKEN AUTH
     * THE UI HAS NO CONTROL ON SENDING AND GIVING ME ROLE
     * THE DATABASE DECIDES WHO IS WHO
     */
    router.post("/login", AadharRoutes.AadharParser, async (req, res) => {
      let response: IResponse = {};
      let a: IAadhar = req.body.app;
      console.log(JSON.stringify(a) + "req.bodyyyyyyy");
      response = await CrudManager.Read(a);
      if (response.result.length >= 1 && response.error == null) {
        a.id = response.result[0].id;
        console.log(a.id + "idddddddddddd");
        res.send(await OtpPlugin.Send_OTP(a));
      } else {
        response = await CrudManager.Create(a);
        if (response.result != null) {
          a.id = response.result.id;
          res.send(await OtpPlugin.Send_OTP(a));
        }
      }
    });

    router.post(
      "/validate-otp",
      EnsureAuth,
      EnsureTemporaryLogin,
      ExtractAadhar,
      OTPParser,
      async (req, res) => {
        let a: IOTP = req.body.app;
        let u: IAadhar = req.body.aadhar;
   
        res.send(
          await OtpPlugin.Validate_OTP_Mobile(a, u,true)
        );
      }
    );

    router.get('/',(req,res)=>{
      res.send("hello")
    })

    router.post("/updateProfile",EnsureAuth,EnsureUserLogin,ExtractAadhar, async(req,res)=>{
      let response: IResponse = {};
      let p:IAadhar=new IAadhar();
      console.log(JSON.stringify(req.body), "personal profile");
      p=req.body.personalProfile;
      p.id=req.body.aadhar.id;
      p.dateofBirth = req.body.personalProfile.date + "-" + req.body.personalProfile.month + "-" + req.body.personalProfile.year;
      p.profileCompletion=true;
      response = await CrudManager.Update(p);
      if(response.result!=null&&response.error==null){
        console.log("if")
        response.status=STATUS.OK;
        response.result=response.result;
      }
      else{
        console.log("else")
        response.status=STATUS.AUTHERROR;
        response.result=null
      }
      res.send(response)
    })
  }
}
