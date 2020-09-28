import { Router } from "express";
import { CrudManager, IResponse, STATUS } from "@managers/crud.manager";
import { SchemaParser } from "@plugins/schemaparser.plugin";
import { IUser, IUserRole, UserPlugin } from "@plugins/user.plugin";
import { Authorization } from "@middleware/authorization";
import { CustomErrors } from "@plugins/error.plugin";
import { Authentication } from "@middleware/authentication";
import { IAadhar, IKYCSTATUS } from "@modules/aadhar/aadhar.model";
import { OtpPlugin, IOTP } from "@plugins/otp.plugin";
import { IKYC } from "@modules/kyc/kyc.model";
import { IAddFamily } from "@modules/addfamily/addfamily.model";

const path = require('path');
var multer = require('multer');
var appRoot = require('app-root-path')

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


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(appRoot.path, 'uploads/kycDocuments'))
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
})


var upload2 = multer({
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
  private static async FamilyParser(req, res, next) {

    try {
      let a: IAddFamily = new IAddFamily();
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
    const FamilyParser = this.FamilyParser;
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

    router.get('/hello', (req, res) => {
      res.send("hello server deployed")
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
      let user: IAadhar = new IAadhar();
      user.id = a.id;
      console.log(JSON.stringify(a) + "dataaaaa")
      profile.image = a.image;
      profile.id = a.id;
      response = await CrudManager.UpdateOne(profile);
      console.log(JSON.stringify(response))
      if (response.error == null && response.status == STATUS.OK) {
        response = await CrudManager.Read(user);
        if (response.result.length >= 1 && response.error == null) {
          response.result = response.result
        }
        response.status = STATUS.OK;

      }
      else {
        response.status = STATUS.IOERROR;
        response.result = null
      }

      res.send(response)
    })

    router.post("/updateIdProof", EnsureAuth, EnsureUserLogin, ExtractAadhar, async (req, res) => {
      let response: IResponse = {};
      let a = req.body;
      let profile: IAadhar = new IAadhar();
      let user: IAadhar = new IAadhar();
      user.id = a.id;
      console.log(JSON.stringify(a) + "dataaaaa")
      profile.idProof = a.idProof;
      profile.id = a.id;
      response = await CrudManager.UpdateOne(profile);
      console.log(JSON.stringify(response))
      if (response.error == null && response.status == STATUS.OK) {
        response = await CrudManager.Read(user);
        if (response.result.length >= 1 && response.error == null) {
          response.result = response.result
        }
        response.status = STATUS.OK;

      }
      else {
        response.status = STATUS.IOERROR;
        response.result = null
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

    router.post("/changeMobileNumber", EnsureAuth, EnsureUserLogin, ExtractAadhar, AadharRoutes.AadharParser, async (req, res) => {
      let response: IResponse = {};
      console.log(JSON.stringify(req.body.app) + "req.bodyyyyyyy");
      let reqdata = req.body.app;
      let aadhar: IAadhar = new IAadhar()
      let a: IAadhar = req.body.app;

      response = await CrudManager.Read(a);
      if (response.result.length >= 1 && response.error == null) {
        console.log("already exists")
        response.status = STATUS.IOERROR;
        response.result = null;

      } else {
        console.log("new number")
        aadhar.mobileNumber = reqdata.mobileNumber;
        aadhar.id = req.body.aadhar.id;
        res.send(await OtpPlugin.Send_OTP(aadhar));

      }
      res.send(response)
    });

    router.post(
      "/validateOtp/changeMobileNumber",
      EnsureAuth,
      EnsureTemporaryLogin,
      ExtractAadhar,
      async (req, res) => {
        let response: IResponse = {}
        let response2: IResponse = {}
        console.log(JSON.stringify(req.body))
        let otp = req.body.otp;
        let mobile = req.body.mobileNumber;
        let aadhar: IAadhar = req.body.aadhar;


        response = await OtpPlugin.Validate_OTP_ChangeMobileNUmber(otp, aadhar, true)
        console.log(response.token + "otp validation responseeee")
        if (response.status == STATUS.OK && response.error == null) {
          console.log("first if")
          let newaadhar: IAadhar = new IAadhar();
          newaadhar.id = aadhar.id;
          newaadhar.mobileNumber = mobile;
          console.log(JSON.stringify(newaadhar) + "aadhaaaar")
          response2 = await CrudManager.Update(newaadhar);
          console.log(JSON.stringify(response2) + "updation responseese")
          if (response2.status == STATUS.OK && response2.error == null) {
            console.log("second ifff")
            response.result = response2.result;
            response.status = STATUS.OK;
            response.token = response.token;
          }
          else {
            console.log("second else")
            response.result = null;
            response.status = STATUS.IOERROR;
            response.token = response.token;
          }
        }
        else {
          console.log("first else")
          response.result = null;
          response.error = CustomErrors.INVALID_OTP;
          response.status = STATUS.AUTHERROR;
          response.token = response.token;
        }
        res.send(response)
      }

    );

    router.post("/kyc/kyc-file", upload2.single('kycFile'), async (req: any, res) => {

      const { length: l, [l - 1]: fileName } = req.file.filename.split('/');
      console.log("req.file", req.file, fileName, "kyc");
      res.send({ ...req.file, name: fileName })
    });




    router.post("/kyc/kyc-update", EnsureAuth, EnsureUserLogin, ExtractAadhar, async (req, res) => {
      let response: IResponse = {};
      // let kyc: IKYC = new IKYC();
      // console.log(JSON.stringify(req.body.aadhar), "KYC Update profile");
      // kyc.aadharID = req.body.aadhar.id;
      // response = await CrudManager.Read(kyc)
      // console.log(response.result,"@@@@@@@@@@@@@@@@@@")
      // if (response.result.length >=1 && response.error == null && response.status == STATUS.OK) {
      //   console.log("inside Update---------------->")
      //   let kyc_update: IKYC = new IKYC();
      //   kyc_update.id = response.result[0].id;
      //   kyc_update.documentType = req.body.documentType;
      //   kyc_update.fileInput = req.body.fileInput;
      //   kyc_update.aadharID = req.body.aadhar.id;
      //   response = await CrudManager.Update(kyc_update);
      //   if (response.result != null && response.error == null) {
      //     console.log("if")
      //     response.status = STATUS.OK;
      //     response.result = response.result;
      //   }
      //   else {
      //     console.log("else")
      //     response.status = STATUS.AUTHERROR;
      //     response.result = null
      //   }
      // }
      // else {
      console.log("inside create---------------->")
      let kyc_create: IKYC = new IKYC();
      kyc_create.documentType = req.body.documentType;
      kyc_create.fileInput = req.body.fileInput;
      kyc_create.aadharID = req.body.aadhar.id;
      response = await CrudManager.Create(kyc_create);
      if (response.result != null && response.error == null) {
        let aadhar: IAadhar = new IAadhar();
        aadhar.kycStatus = IKYCSTATUS.PENDING;
        aadhar.id = req.body.aadhar.id;
        let updateAadhar = await CrudManager.Update(aadhar);
        console.log("if")
        response.status = STATUS.OK;
        response.result = updateAadhar.result;
      }
      else {
        console.log("else")
        response.status = STATUS.AUTHERROR;
        response.result = null
      }
      // }
      res.send(response)
    })

    router.post("/aadhar/get-aadhar-by-id", EnsureAuth, EnsureUserLogin, ExtractAadhar, async (req, res) => {
      let response: IResponse = {};
      let aadhar: IAadhar = new IAadhar();
      aadhar.id = req.body.aadhar.id;
      response = await CrudManager.Read(aadhar);
      if (response.result.length >= 1 && response.error == null && response.status == STATUS.OK) {
        response.status = STATUS.OK;
        response.result = response.result;
        response.error = null
      }
      else {
        response.status = STATUS.AUTHERROR;
        response.result = null;
      }
      res.send(response)
    })
    router.post("/aadhar/get-by-mobile", EnsureAuth, EnsureUserLogin, ExtractAadhar, AadharRoutes.AadharParser, async (req, res) => {
      let response: IResponse = {};
      let a: IAadhar = req.body.app;
      response = await CrudManager.Read(a);
      if (response.result.length >= 1 && response.error == null && response.status == STATUS.OK) {
        response.status = STATUS.OK;
        response.result = response.result;
        response.error = null
      }
      else {
        response.status = STATUS.AUTHERROR;
        response.result = null;
      }
      res.send(response)
    })

    // family/add-family-member
    router.post("/family/add-family-member", EnsureAuth, EnsureUserLogin, ExtractAadhar, FamilyParser, async (req, res) => {
      let response: IResponse = {};
      let family: IAddFamily = req.body.app;
      response = await CrudManager.Create(family);
      if (response.result != null && response.error == null && response.status == STATUS.OK) {
        if (req.body.memberKYCStatus == IKYCSTATUS.PENDING || req.body.memberKYCStatus == null) {
          let aadhar: IAadhar = new IAadhar();
          aadhar.id = req.body.memberAadharID;
          aadhar.kycStatus = IKYCSTATUS.FAMILY_KYC;
          let updatekyc = await CrudManager.Update(aadhar);
        }
        response.status = STATUS.OK;
        response.result = response.result;
        response.error = null
      }
      else {
        response.status = STATUS.AUTHERROR;
        response.result = null;
      }
      res.send(response)
    })

    router.post("/family/add-aadhar-add-family-member", EnsureAuth, EnsureUserLogin, ExtractAadhar, FamilyParser, async (req, res) => {
      let response: IResponse = {};
      let family: IAddFamily = req.body.app;
      let aadhar: IAadhar = new IAadhar();
      console.log(req.body.memberMobileNumber)
      aadhar.mobileNumber = req.body.memberMobileNumber;
      aadhar.kycStatus = req.body.memberKYCStatus;
      response = await CrudManager.Create(aadhar);
      if (response.result != null && response.error == null && response.status == STATUS.OK) {
        response.status = STATUS.OK;
        response.result = response.result;
        response.error = null
      }
      else {
        response.status = STATUS.AUTHERROR;
        response.result = null;
      }
      res.send(response)
    })

    router.post("/family/get-family-by-id", EnsureAuth, EnsureUserLogin, ExtractAadhar, FamilyParser, async (req, res) => {
      let response: IResponse = {};
      let family: IAddFamily = req.body.app;
      response = await CrudManager.Read(family);
      if (response.result != null && response.error == null && response.status == STATUS.OK) {
        response.status = STATUS.OK;
        response.result = response.result;
        response.error = null
      }
      else {
        response.status = STATUS.AUTHERROR;
        response.result = null;
      }
      res.send(response)
    })

    router.post('/admin-getallAadhars', EnsureAuth, EnsureUserLogin, AadharRoutes.AadharParser, async (req, res) => {
      let response: IResponse = {};
      let a: IAadhar = new IAadhar()
      console.log(JSON.stringify(a))
      response = await CrudManager.Read(a);
      if (response.result != null && response.error == null) {
          response.result = response.result;
          response.status = STATUS.OK;
          response.error = null
      }
      else {
          response.result = null;
          response.status = STATUS.IOERROR
      }
      res.send(response)
  });
  }
}
