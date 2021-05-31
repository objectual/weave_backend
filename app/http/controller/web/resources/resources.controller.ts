import path from "path";
import * as appRoot from 'app-root-path'
import config from "config";
export class Resources{
    public_image_get (req, res) {
        
        let filename = req.params.filename.replace(/\//g, '.')
        let split = filename.split(".");
        let ext = split[split.length-1];
        if (
            ext === "png" ||
            ext === "jpeg" ||
            ext === "jpg"
        ) {
            res.sendFile(
                path.join(appRoot.path, "public/images", filename)
            );
        }else{
            res.redirect(`${config.get("origin")}/error/403?err=LOOK'S LIKE YOU SEARCHED FOR SOMETHING YOU'RE NOT ALLOWED TO`)
        }
    };
    
}