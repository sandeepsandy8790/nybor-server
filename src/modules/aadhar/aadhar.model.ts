import { Schema } from "mongoose";
const shortid = require("shortid");

export class IAadhar {
  id?: string;
  mobileNumber?: string;
  fullName?: string;
  dateofBirth?: string;
  gender?: IGender
  image?: string;
  profileCompletion: boolean;
  accountCreated?: Date;
  profilePercentage?: number;
  idProof?: string;
  kycStatus?: number;
  schemaName = "Aadhar";
  schema = schemaDefinition;
}

export class IGender {
  id: number;
  gender: string;
  selected: boolean;
}

export enum IKYCSTATUS {
  NO,
  PENDING,
  VERIFIED,
  FAMILY_KYC,
}



export var schemaDefinition: Schema = new Schema({
  id: { type: String, default: shortid.generate, unique: true, required: true },
  mobileNumber: { type: String, default: "", unique: false, required: true },
  fullName: { type: String, default: "", unique: false, required: false },
  dateofBirth: { type: String, default: "", unique: false, required: false },
  gender: { type: Object, default: "", select: true, unique: false, required: false },
  image: { type: String, default: "", unique: false, required: false },
  accountCreated: { type: Date, default: Date.now(), select: true, unique: false },
  profileCompletion: { type: Boolean, default: false, unique: false, required: false },
  profilePercentage: { type: Number, default: 0, select: true, unique: false, required: false },
  idProof: { type: String, default: "", unique: false, required: false },
  kycStatus: { type: Number, default: 0, unique: false, required: false }
});
