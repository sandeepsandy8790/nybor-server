import { IAdmin } from "@modules/admin/admin.model";
import { CrudManager } from "@managers/crud.manager";
import { SchemaParser } from "@plugins/schemaparser.plugin";
import { Router } from "express";
import { AdminPlugin } from "@plugins/admin.plugin";

export class AdminRoutes {
    /**
  * Converts every incoming object
  * into a probable Aadhar Object
  * @param req
  * @param res
  * @param next
  */
    private static async AdminParser(req, res, next) {
        try {
            let a: IAdmin = new IAdmin();
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


        router.post('/admin-register', AdminRoutes.AdminParser, async (req, res) => {
            let a: IAdmin = req.body.app;
            console.log(JSON.stringify(a))
        
            res.send(await AdminPlugin.RegisterAdmin(a));
        });

        router.post('/admin-login', AdminRoutes.AdminParser, async (req, res) => {
            let a: IAdmin = req.body.app;
            console.log(JSON.stringify(a))
        
            res.send(await AdminPlugin.AdminLogin(a));
        });
    }
    
}