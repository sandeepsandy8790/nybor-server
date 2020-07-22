import {Schema} from 'mongoose'
const shortid = require('shortid');

export class IAadhar{
    id?:string;
    mobileNumber?:string;
    firstName?:string;
    lastName?:string;
    dateofBirth?:string;
    gender?:string;
    image?:string;
    accountCreated?:Date;
    schemaName="Aadhar";
    schema=schemaDefinition;
}

export var schemaDefinition:Schema=new Schema({
    id: { type: String, default: shortid.generate, unique: true, required: true },
    mobileNumber: { type: String, default: "", unique: false, required: true },
    firstName: { type: String, default: "", unique: false, required: false },
    lastName: { type: String, default: "", unique: false, required: false },
    dateofBirth: { type: String, default: "", unique: false, required: false },
    gender: { type: String, default: "", unique: false, required: false },
    image: { type: String, default: "", unique: false, required: false },
    accountCreated: { type: Date, default: Date.now(), select: true, unique: false },
})