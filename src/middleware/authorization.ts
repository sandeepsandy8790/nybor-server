import { NextFunction, Request, Response } from "express";
import { CustomErrors } from "@plugins/error.plugin";
import { IUser } from "@plugins/user.plugin";
import { CrudManager, STATUS, IResponse } from "@managers/crud.manager";
const jwt = require('jsonwebtoken');
import * as moment from 'moment-timezone';

export class IHTTPError {
    errorCode;
    errorMessage;
    payload;
}

export class Authorization {



    /** Temporary Login */
    public static async EnsureTemporaryLogin(req, res, next) {
       jwt.verify(req.body.payload, process.env.loginTemporary , function(err, decoded) {
            if(decoded!=null) {
                req.body.userID =  decoded.id; 
                next(); } 
            else if (err) {
            return res.send({ status: STATUS.AUTHERROR, message: CustomErrors.INVALID_TOKEN }); }
        });   
    }

    /** Admin Login */
    public static async EnsureAdminLogin(req, res, next) {
        let decoded = await Authorization.DecodeAdmin(req.body.payload);
        if (decoded != null) { req.body.aadharID = decoded.id; next(); }
        else { return res.status(501).send({ message: CustomErrors.INVALID_TOKEN }); }

    }

    /** Client Login */
    public static async EnsureClientLogin(req, res, next) {
        let decoded = await Authorization.DecodeClient(req.body.payload);
        if (decoded != null) { req.body.aadharID = decoded.id; next(); }
        else { return res.status(501).send({ message: CustomErrors.INVALID_TOKEN }); }
    }

    /** User Login */
    public static async EnsureUserLogin(req, res, next) {
        try {

            console.log("Attempting Decoding :" + req.body.payload);
            let decoded = await Authorization.DecodeUser(req.body.payload);

            console.log("Decoded :" + decoded);

            if (decoded != null) { req.body.userID = decoded.id; next(); }
            else { return res.status(501).send({ message: CustomErrors.INVALID_TOKEN }); }
        }
        catch (error) {
            console.log("Error :" + error);

        }

    }


    /**
     * This function is used to verify if the
     * user is authenticated. This is often  used
     * in WHOAMI queries just to return the user
     * details
     * @param payload 
     */
    public static async EnsureGenericAuthorization(req, res, next) {
        console.log("Geenric Authentication");

        try {
            let decodeUser = await Authorization.DecodeUser(req.body.payload);
            let decodeAdmin = await Authorization.DecodeClient(req.body.payload);
            let decodeClient = await Authorization.DecodeAdmin(req.body.payload);
            let decoded;

            // console.log("Decoded User :"+decodeUser);
            // console.log("Decoded Admin :"+decodeAdmin);
            // console.log("Decoded Client :"+decodeClient);

            if (decodeUser != null) decoded = decodeUser;
            else if (decodeAdmin != null) decoded = decodeAdmin;
            else if (decodeClient != null) decoded = decodeClient;
            else decoded = null;

            //console.log("Decoded Token :"+JSON.stringify(decoded));

            if (decoded != null) { req.body.aadharID = decoded.id; next(); }
            else { return res.status(501).send({ message: CustomErrors.INVALID_TOKEN }); }

        }
        catch (error) {
            console.log("Error :" + error);
            return res.status(501).send({ message: CustomErrors.INVALID_TOKEN });
        }

    }


    /**
   * This function is used to verify if the
   * user is authenticated as either a client(staff)
   * or a super admin. If the  user is identified as
   * staff / client we do one extra layer of security by inserting
   * his REALM automatically so he cannot modify other's REALM
   * If admi , we just let him do whatever he wants
   * @param payload 
   */
    public static async EnsureClientOrAdminLogin(req, res, next) {
        let decodeAdmin = await Authorization.DecodeClient(req.body.payload);
        let decodeClient = await Authorization.DecodeAdmin(req.body.payload);
        let decoded;

        if (decodeAdmin != null) decoded = decodeAdmin;
        else if (decodeClient != null) decoded = decodeClient;
        else decoded = null;

        if (decoded != null) { req.body.aadharID = decoded.id; next(); }
        else { return res.status(501).send({ message: CustomErrors.INVALID_TOKEN }); }
    }


    /***
     * JWT HELPERS TO EXTRACT TOKEN
     */

    private static async DecodeUser(payload) {
        try {
            var decoded = jwt.verify(payload, process.env.loginUser);
            //console.log("User Found"+decoded);
            return decoded;
        }
        catch (error) {
            //console.log("User Error :"+error);   
            return null;
        }
    }

    private static async DecodeAdmin(payload) {
        try {
            var decoded = jwt.verify(payload, process.env.loginAdmin);
            //console.log("Found as a admin"+decoded);
            return decoded;
        }
        catch (error) {
            //console.log("Admin Error :"+error); 
            return null;
        }
    }

    private static async DecodeClient(payload) {
        try {
            var decoded = jwt.verify(payload, process.env.loginClient);
            return decoded;
        }
        catch (error) {
            //console.log("Client Error :"+error); 
            return null;
        }
    }



}