
/**
 * String based operations
 */
export class StringPlugin
{
    /**
     * This splits a string into two parts
     * you supply an index and it returns an array
     */
    public static splitAt(x:string,index)
    {
        let stringArray:Array<string> = new Array<string>();
        stringArray.push(x.slice(0,index).replace("/",""));
        stringArray.push(x.slice(index).replace("/",""));
        return stringArray;
    }
}