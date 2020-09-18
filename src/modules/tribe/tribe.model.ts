import { Schema } from "mongoose";
const shortid = require("shortid");

export class ITribe {
  id?: string;
  houseType?:string;
  city?:string;
  societyName?:string;
  blockNo?:string;
  flatNo?:string;
  ownershipType?:string;
  rentType?:string;
  CreatedDate?:Date; 
  schemaName = "Tribe";
  schema = schemaDefinition;
}



export var schemaDefinition: Schema = new Schema({
  id: { type: String, default: shortid.generate, unique: true, required: true },
  houseType: { type: String, default: "", unique: false, required: true },
  city: { type: String, default: "", unique: false, required: true },
  societyName: { type: String, default: "", unique: false, required: true },
  blockNo: { type: String, default: "", unique: false, required: true },
  flatNo: { type: String, default: "", unique: false, required: true },
  ownershipType: { type: String, default: "", unique: false, required: true },
  rentType: { type: String, default: "", unique: false, required: true },
  CreatedDate: { type: Date, default: Date.now(), select: true, unique: false },
 
});
