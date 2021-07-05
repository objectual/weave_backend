import path from "path";
import * as appRoot from 'app-root-path'
import { Request, Response } from "express"

export class Error {
    unauthorized(req:Request, res:Response) {
        res.status(401).render(path.join(appRoot.path, "views/error/401.ejs"));
    };
    forbidden(req:Request, res:Response) {
        if (req.query.err == null || req.query.err == "") {
            req.query.err = "Misuse of resource";
        }
        res.status(403).render(path.join(appRoot.path, "views/error/403.ejs"), { error: req.query.err });
    };
    not_found_page(req:Request, res:Response) {
        res.status(404).render(path.join(appRoot.path, "views/error/404.ejs"));
    };
    internal_server_error(req:Request, res:Response) {
        if (req.query.err == null || req.query.err == "") {
            req.query.err = "Misuse of resource";
        }
        res.status(500).render(path.join(appRoot.path, "views/error/500.ejs"), { error: req.query.err });
    };
}