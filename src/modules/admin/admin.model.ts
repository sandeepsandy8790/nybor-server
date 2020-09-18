import { Schema } from "mongoose";
const shortid = require("shortid");

export class IAdmin {
  id?: string;
  email?:any; 
  password?:any; 
  firstName?:string;
  lastName?:string;
  accountCreated?:Date; 
  lastActive?:Date;
  schemaName = "Admin";
  schema = schemaDefinition;
}



export var schemaDefinition: Schema = new Schema({
  id: { type: String, default: shortid.generate, unique: true, required: true },
  email: { type: String, default: "", unique: false, required: true },
  password: { type: String, default: "", unique: false, required: true },
  firstName: { type: String, default: "", unique: false, required: true },
  lastName: { type: String, default: "", select: true, unique: false, required: true },
  lastActive: { type: Date, default: Date.now(), unique: false, select: true },
  accountCreated: { type: Date, default: Date.now(), select: true, unique: false },
 
});
