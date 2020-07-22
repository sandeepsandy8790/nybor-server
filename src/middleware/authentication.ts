import { IHTTPError } from "./authorization";
import { CustomErrors } from "@plugins/error.plugin";
import { CrudManager, IResponse } from "@managers/crud.manager";
import { IUser } from "@plugins/user.plugin";

const jwt = require('jsonwebtoken');
import * as moment from 'moment-timezone'
import { IAadhar } from "@modules/aadhars/aadhar.model";

export class Authentication {
    /**
     * YOU SHOULD NEVER USE THIS MIDDLEWARE
     * THIS DOESNT CHECK FOR VALIDATION
     * THIS IS USED LIKE A SWITCH TO MOVE FROM
     * DEV TO QA TO PROD AND ALLOWS USERS TO
     * WUICKLY TEST THEIR ROUTES WITHOUT CHANGING THE SIGNATURE
     * @param req 
     * @param res 
     * @param next 
     */
    public static async BypassAuth(req, res, next) {


        if (process.env.mode == "development" && process.env.bypassAuthorization) {
            next();
        }
        else {
            console.error("APPLICATION HAS NOT ENABLED GHOST MODE OR IS NOT ALLOWED");
            return res.status(401).send({ message: CustomErrors.NO_TOKEN });
        }
    }


    /**
     * This simply extracts an authorization token and
     * relays it back to the next function for futher processing
     * @param req 
     * @param res 
     * @param next 
     */
    public static async EnsureAuth(req, res, next) {
        console.log("Ensuring Authentication");
        try {
            let x: IHTTPError = new IHTTPError();
            // step-1: has the user really supplied an autheorization header
            if (!req.header('Authorization')) {
                return res.status(401).send({ message: CustomErrors.NO_TOKEN });
            }
            // step-2: extract the token from the header
            var token = req.header('Authorization').split(' ')[1];
            token = token.replace(/^JWT\s/, '');
            token = token.replace(/\"/g, "");

            // step-3: Decrypt the payload and validate its authenticity
            if (token) {
                console.log("Next----" + token);
                req.body.payload = token;
                next();
            }
            else {
                return res.status(401).send({ message: CustomErrors.NO_TOKEN });
            }
        }
        catch (error) {
            console.log("Error :" + error);
            return res.status(401).send({ message: CustomErrors.NO_TOKEN });
        }
    }


    /**
      * After you have been assured of a valid auth token
      * let us just query our database and find more about the user
      * @param req 
      * @param res 
      * @param next 
      */
    public static async ExtractAadharCard(req, res, next) {

        console.log("Hello Aadhar");

        if (req.body.userID != null) {
            let a: IAadhar = new IAadhar();
            a.id = req.body.userID;
            let response = await CrudManager.Read(a);
            if (response.result != null && response.error == null) {
                req.body.aadhar = response.result[0];
                next();
                //password expiry
            }
            else {
                return res.status(501).send({ message: CustomErrors.INVALID_TOKEN });
            }
        }
        else {
            return res.status(501).send({ message: CustomErrors.INVALID_TOKEN });
        }
    }
    public static async ExtractUserID(req, res, next) {

        console.log("Hello Aadhar");

        if (req.body.sessionID != null) {
            //using session
            let a: IUser = new IUser();
            a.id = req.body.sessionID;
            let response = await CrudManager.Read(a);
            if (response.result != null && response.error == null) {
                req.body.userID = response.result[0].userID;
                next();
            }
            else {
                return res.status(501).send({ message: CustomErrors.INVALID_TOKEN });
            }
        }
        else {
            return res.status(501).send({ message: CustomErrors.INVALID_TOKEN });
        }
    }
    public static async EnsureRole(req, res, next) {
        let u: IUser = req.body.aadhar;
        const roleId = req.body.session.roleId;
        console.log('**************************************** Checking Role... ***********************************')
        if (u.roleID === roleId) {
            console.log(`**************************************** Role Confirmed !! ${u.userRole} ***********************************`)
            next()
        }
        else if (u.roleID !== roleId) {
            console.log('**************************************** Role Not Confirmed !! ***********************************')
            let a: IUser = new IUser();
            a.id = u.id;
            a.isActive = false
            await CrudManager.Update(a);
            return res.status(403).send({ message: "YOU CANNOT ACCESS THIS. PLEASE CONTACT YOUR ADMINISTRATOR" });
        }
        else {
            console.log('**************************************** No RoleId !! ***********************************')
            return res.status(403).send({ message: "YOU CANNOT ACCESS THIS. PLEASE CONTACT YOUR ADMINISTRATOR" });

        }
    }

    public static async EnsureRoleAccess(role) {
        return async (req, res, next) => {
            console.log("In ensure RoleAccess method");
            let a: IUser = new IUser;
            a.id = req.session.userID;
            let response = await CrudManager.Read(a);
            if (response.result != null && response.error == null) {
                let x = response.result[0];
                a.userRole = x.userRole;
                if (role == a.userRole) {
                    next();
                }
                else {
                    return res.status(403).send({ message: "YOU CANNOT ACCESS THIS. PLEASE CONTACT YOUR ADMINISTRATOR" });
                }
            }
        }
    }
}