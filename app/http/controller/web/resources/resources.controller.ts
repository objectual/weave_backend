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
            res.status(403).render(path.join(appRoot.path, "views/error/403.ejs"), { error: "YOU CAN'T ACCESS THIS ROUTE THROUGH THE BROWSER" })
        }
    };
    public_css_get (req, res) {
        
        let filename = req.params.filename.replace(/\//g, '.')
        let split = filename.split(".");
        let ext = split[split.length-1];
        if (
            ext === "css"
        ) {
            res.sendFile(
                path.join(appRoot.path, "views/error/", filename)
            );
        }else{
            res.status(403).render(path.join(appRoot.path, "views/error/403.ejs"), { error: "YOU CAN'T ACCESS THIS ROUTE THROUGH THE BROWSER" })
        }
    };
}