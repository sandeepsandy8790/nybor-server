
import { CrudManager, IResponse, STATUS } from "@managers/crud.manager";
import { SchemaParser } from "@plugins/schemaparser.plugin";
import { Router, response } from "express";
import { ITribe } from "@modules/tribe/tribe.model";
import { Authentication } from "@middleware/authentication";
import { Authorization } from "@middleware/authorization";

export class TribeRoutes {
    /**
  * Converts every incoming object
  * into a probable Aadhar Object
  * @param req
  * @param res
  * @param next
  */
    private static async TribeParser(req, res, next) {
        try {
            let a: ITribe = new ITribe();
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

    public static async create(router: Router) {

        const EnsureAuth = Authentication.EnsureAuth;
        const EnsureUserLogin = Authorization.EnsureUserLogin;

        router.post('/admin-addTribe', EnsureAuth, EnsureUserLogin, TribeRoutes.TribeParser, async (req, res) => {
            let response: IResponse = {};
            let a: ITribe = req.body.app;
            console.log(JSON.stringify(a))
            response = await CrudManager.Create(a);
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

        router.post('/admin-getAllTribes', EnsureAuth, EnsureUserLogin, TribeRoutes.TribeParser, async (req, res) => {
            let response: IResponse = {};
            let a: ITribe = new ITribe()
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

        router.post('/admin-getTribeDetails', EnsureAuth, EnsureUserLogin, TribeRoutes.TribeParser, async (req, res) => {
            let response: IResponse = {};
            let a: ITribe = req.body.app;
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