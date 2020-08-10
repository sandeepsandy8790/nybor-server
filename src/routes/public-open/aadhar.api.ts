import { Router } from "express";
import { CrudManager, IResponse, STATUS } from "@managers/crud.manager";
import { SchemaParser } from "@plugins/schemaparser.plugin";
import { IUser, IUserRole, UserPlugin } from "@plugins/user.plugin";
import { Authorization } from "@middleware/authorization";
import { CustomErrors } from "@plugins/error.plugin";
import { Authentication } from "@middleware/authentication";
import { IAadhar } from "@modules/aadhars/aadhar.model";
import { OtpPlugin, IOTP } from "@plugins/otp.plugin";

const path = require('path');
var multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
})
var upload = multer({
  storage: storage,
  limits: {
    files: 1,
    fieldSize: 50 * 1024 * 1024
  }
})
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
    const OTPParser = this.OTPParser;
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
          await OtpPlugin.Validate_OTP_Mobile(a, u, true)
        );
      }
    );

    router.get('/', (req, res) => {
      res.send("hello")
    })

    router.post("/updateProfile", EnsureAuth, EnsureUserLogin, ExtractAadhar, async (req, res) => {
      let response: IResponse = {};
      let p: IAadhar = new IAadhar();
      console.log(JSON.stringify(req.body), "personal profile");
      p = req.body.personalProfile;
      p.id = req.body.aadhar.id;
      p.dateofBirth = req.body.personalProfile.date + "-" + req.body.personalProfile.month + "-" + req.body.personalProfile.year;
      p.profileCompletion = true;
      response = await CrudManager.Update(p);
      if (response.result != null && response.error == null) {
        console.log("if")
        response.status = STATUS.OK;
        response.result = response.result;
      }
      else {
        console.log("else")
        response.status = STATUS.AUTHERROR;
        response.result = null
      }
      res.send(response)
    })

    router.post("/updateProfileImage", EnsureAuth, EnsureUserLogin, ExtractAadhar, async (req, res) => {
      let response: IResponse = {};
      let a = req.body;
      let profile: IAadhar = new IAadhar();
      let user:IAadhar=new IAadhar();
      user.id=a.id;
      console.log(JSON.stringify(a) + "dataaaaa")
      profile.image = a.image;
      profile.id = a.id;
      response = await CrudManager.UpdateOne(profile);
      console.log(JSON.stringify(response))
      if (response.error == null && response.status == STATUS.OK) {
        response=await CrudManager.Read(user);
        if (response.result.length >= 1 && response.error == null) {
          response.result=response.result
        }
        response.status = STATUS.OK;
        
      }
      else{
        response.status=STATUS.IOERROR;
        response.result=null
      }

      res.send(response)
    })

    router.post("/updateIdProof", EnsureAuth, EnsureUserLogin, ExtractAadhar, async (req, res) => {
      let response: IResponse = {};
      let a = req.body;
      let profile: IAadhar = new IAadhar();
      let user:IAadhar=new IAadhar();
      user.id=a.id;
      console.log(JSON.stringify(a) + "dataaaaa")
      profile.idProof = a.idProof;
      profile.id = a.id;
      response = await CrudManager.UpdateOne(profile);
      console.log(JSON.stringify(response))
      if (response.error == null && response.status == STATUS.OK) {
        response=await CrudManager.Read(user);
        if (response.result.length >= 1 && response.error == null) {
          response.result=response.result
        }
        response.status = STATUS.OK;
        
      }
      else{
        response.status=STATUS.IOERROR;
        response.result=null
      }

      res.send(response)
    })
    router.post("/profile/image", upload.single('image'), EnsureAuth, EnsureUserLogin, ExtractAadhar, async (req: any, res) => {
      console.log("+++++++++++++++++++++++++++++++++++++ Image Updating +++++++++++++++++++++++++++++++++++++");

      let d = req.file;
      d.aadhar = null;
      res.send(req.file);
      // response = await CrudManager.Update(d);
      // if (response.error == null) {
      //     response.result = "Doctor Image Uploaded Successfully..!"
      // }

    });
  }
}
