import path from "path";
import * as appRoot from 'app-root-path'
import { Request, Response } from "express"

export class Views {
    index(req:Request, res:Response) {
        res.render(path.join(appRoot.path, "views/pages/welcome.ejs"));
    };
    login(req:Request, res:Response) {
        res.render(path.join(appRoot.path, "views/pages/login.ejs"));
    };

    social_callback(req:Request, res:Response) {
        res.cookie("user", JSON.stringify(req['user']));
        // Successful authentication, redirect success.
        res.render(path.join(appRoot.path, 'views/pages/social-success.ejs'), { user: req['user'] })
    }

    not_found(req:Request, res:Response) {
        res.render(path.join(appRoot.path, "views/error/404.ejs"));
    };
}