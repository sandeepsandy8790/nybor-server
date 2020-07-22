import { IResponse, STATUS } from "@managers/crud.manager";


export class  CustomErrors
{
    public static LOGIN_FAILED =     "SORRY YOUR LOGIN FAILED";
    public static NO_ACCOUNT =       "NO ACCOUNT FOUND";
    public static INVALID_OTP =      "INVALID OTP";
    public static REG_NOT_ALLOWED =  "THIS EMAIL ID IS ALREADY REGISTERED. PLEASE TRY LOGGING IN";
    public static USER_NOT_ACTIVE =  "USER NOT ACTIVE OR ROLE NOT ASSIGNED. PLEASE CONTACT YOUR ADMINISTRATOR";
    public static NO_TOKEN =         "YOU ARE NOTH AUTHORIZED TO VIEW THIS CONTENT";
    public static INVALID_TOKEN =    "YOUR AUTHORIZATION COULD NOT BE VERIFIED. PLEASE LOGOUT AND LOGIN AGAIN";

    public static NO_SCHOOL =        "AS AN ADMIN YOU NEED TO PROVIDE WHICH SCHOOL REALM YOU WANT TO CHANGE";
    public static SCHOOL_NOT_FOUND =  "YOU HAVE NOT BEEN ASSIGNED ANY SCHOOL OR THE SCHOOL ID WAS WRONG. CONTACT ADMIN";

    public static WRONG_PAYMENT =  "THE PAYMENT AMOUNT YOU ARE TRYING TO ADD DOES NOT MATCH WITH THE SYSTEM VALUE.YOU CAN ONLY PAY WHAT IS DUE.";
}

export class ErrorPlugin
{
        /**
         * Santizies the error string before sending it to UI
         * You should send the entire error string to the UI
         * @param e
         */
        public static SantizeError(e):string
        {

            return "some error";
        }


        public static SendZeroError():IResponse
        {
            let response:IResponse = {};
            response.result=null;
            response.error = "NO MATCHING RECORD FOUND";
            response.status = STATUS.ZERO;
            return response;
        }
        
}