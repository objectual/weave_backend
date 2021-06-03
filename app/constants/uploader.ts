import compose from "composable-middleware"
import * as fs from 'fs';
import * as path from 'path';

// This implementation requires busboy-body-parser initialized in app
interface IFields {
    name: string;
}
export class Uploader {
    static dest: string = './public/images';
    public static fields(names: IFields[]) {
        return (
            compose()
                .use((req, res, next) => { 
                    names.forEach(o => Uploader.fileFilter(req.files[o.name], (error, status) => {
                        if (!status) res.status(500).send({ success: false, msg: error })
                        Uploader.fileStorage(req.files[o.name], (error, status) => {
                            if (!status) res.status(500).send({ success: false, msg: error })
                            next();
                        })
                    }))
                })
        )
    }

    public static fileStorage(files, cb) {
        files.forEach(file => {
            let filePath = path.join(Uploader.dest, `${new Date().toISOString().replace(/:/g, "-")}-${file.name}`);
            fs.writeFile(filePath, file.data, function (err) {
                if (err) {
                    cb(err.message, false);
                }
                file['filePath'] = filePath;
                console.log(file)
            });
        });
        cb(null, true);
    }

    public static fileFilter(files, cb) {
        files.forEach(file => {
            if (
                file.mimetype !== "image/png" &&
                file.mimetype !== "image/jpg" &&
                file.mimetype !== "image/jpeg"
            ) {
                cb("Image uploaded is not of type jpg/jpeg or png", false);
            }
        });
        cb(null, true);
    }
}