
import compose from "composable-middleware"
import config from "config";
import appRoot from "app-root-path";
import path from "path";
import { Request, Response } from "express"

export class BrowserMiddleware {
    public static restrictedBrowser() {
        return (
            compose()
                // Attach user to request
                .use((req:Request, res:Response, next) => {
                    console.log(req.body, req.headers)
                    if (req.headers['x-secret'] == process.env.PASSPHRASE) {
                        // custom header exists, then call next() to pass to the next function
                        next();
                    } else {
                        res.status(403).render(path.join(appRoot.path, "views/error/403.ejs"), { error: "YOU CAN'T ACCESS THIS ROUTE THROUGH THE BROWSER" })
                    }

                })
        );
    }
}