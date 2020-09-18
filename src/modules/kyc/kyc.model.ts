import { Schema } from "mongoose";
const shortid = require("shortid");

export class IKYC {
    id?: string;
    aadharID?: string;
    documentType?: number;
    fileInput?: string;
    createdOn?:Date
    schemaName = "kyc";
    schema = schemaDefinition;
}

export var schemaDefinition: Schema = new Schema({
    id: { type: String, default: shortid.generate, unique: true, required: true },
    aadharID: { type: String, default: null, select: true, unique: false, required: false },
    documentType: { type: Number, default: null, select: true, unique: false, required: false },
    fileInput: { type: String, default: null, select: true, unique: false, required: false },
    createdOn:{type:Date, default:Date.now(),select:true,unique:false,required:false}

})