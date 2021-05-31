
import compose from "composable-middleware"
import config from "config";

export class BrowserMiddleware {
    public static restrictedBrowser() {
        return (
            compose()
                // Attach user to request
                .use((req, res, next) => {
                    if (req.headers['x-secret'] == process.env.PASSPHRASE) {
                        // custom header exists, then call next() to pass to the next function
                        next();
                    } else {
                        res.redirect(`${config.get("origin")}/error/403?err=YOU CAN'T ACCESS THIS ROUTE THROUGH THE BROWSER`);
                    }

                })
        );
    }
}