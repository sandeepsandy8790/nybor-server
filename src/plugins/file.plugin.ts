/**
 * Handles High Level Functions
 * to read and write files & directories
 */
export class FilePlugin
{

    /**
     * Walks through a directory
     * and lists down all the files
     * for you to refer
     * @param dir : Directory to walk
     */
    public static ReadSubDirectories(dir , filelist=null , isDirPath=true) 
    {
        var path = path || require('path');
        var fs = fs || require('fs');
        var files = fs.readdirSync(dir);
        var filelist = filelist || [];

        files.forEach(function(file) 
        {
            if (fs.statSync(path.join(dir, file)).isDirectory()) { filelist = FilePlugin.ReadSubDirectories(path.join(dir, file), filelist);}
            else 
            { 
                filelist.push(path.join(dir,file) , dir);
                
            }
        });
        return filelist;
    };

    /**
     * This removes all upper level folders
     * and provide the relative path of file 
     * to a directory you already know
     * @param file : which has the full path
     * @param dir : dir to which you want to know the relative position
     */
    public static ProvideRelativePath(file:string,dir:string):string
    {   
        let cutOffIndex =  file.indexOf(dir) + dir.length;  // find the directory in the path
        return file.slice(cutOffIndex, file.length);
    } 
    
}