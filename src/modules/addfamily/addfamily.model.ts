import { Schema } from "mongoose";
const shortid = require("shortid");

export class IAddFamily {
    id?: string;
    memberName?: string;
    relation?: string;
    memberAadharID?: string;
    memberMobileNumber?: string;
    aadharID?: string;
    createdOn?: Date
    schemaName = "family";
    schema = schemaDefinition;
}

export var schemaDefinition: Schema = new Schema({
    id: { type: String, default: shortid.generate, unique: true, required: true },
    memberName: { type: String, default: '', select: true, unique: false, required: false },
    relation: { type: String, default: '', select: true, unique: false, required: false },
    memberAadharID:{ type: String, default: '', select: true, unique: false, required: false },
    aadharID: { type: String, default: '', select: true, unique: false, required: false },
    memberMobileNumber: { type: Number, default: '', select: true, unique: false, required: false },
    createdOn: { type: Date, default: Date.now(), select: true, unique: false, required: false }
})