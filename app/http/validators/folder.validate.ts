"use strict";
import Joi from "joi";
import * as _ from "lodash";
import compose from "composable-middleware"
import { IFolder, IFolderCreate,IFolderUpdate } from "../models/folder.model";
import { Sender } from "../services/sender.service";
import { FolderService } from "../services/folder.service";
import { Request, Response } from "express"

class Validator {
    constructor() { }
    //************************ VALIDATE FOLDER CREATE DATA ***********************//
    protected validateCreateFolder(data: IFolderCreate) {
        const schema = Joi.object().keys({
            name: Joi.string().required(),
            user: Joi.object().keys({
                connect: Joi.object().keys({ id: Joi.array().items(Joi.string()) }),
            }),
            group: Joi.object().keys({
                connect: Joi.object().keys({ id: Joi.array().items(Joi.string()) }),
            })
        });
        return Joi.validate(data, schema);
    }

    //************************ VALIDATE FOLDER UPDATE DATA ***********************//
    protected validateUpdateFolder(data: IFolderUpdate) {
        const schema = Joi.object().keys({
            user: Joi.object().keys({
                connect: Joi.object().keys({ id: Joi.array().items(Joi.string()) }),
                disconnect: Joi.object().keys({ id: Joi.array().items(Joi.string()) }),
            }),
            group: Joi.object().keys({
                connect: Joi.object().keys({ id: Joi.array().items(Joi.string()) }),
                disconnect: Joi.object().keys({ id: Joi.array().items(Joi.string()) }),
            })
        });
        return Joi.validate(data, schema);
    }
}
export const FolderValidationMiddleware = new class ValidationMiddleware extends Validator {
    constructor() {
        super();
    }

    validateFolderCreate() {
        return (
            compose()
                .use((req:Request, res:Response, next) => {
                    super.validateCreateFolder(req.body)
                        .then(data => {
                            next();
                        }).catch(error => {
                            var errors = {
                                success: false,
                                msg: error.details[0].message,
                                data: error.name,
                                status: 400
                            };
                            Sender.errorSend(res, errors);
                            return;
                        })
                })    
            .use(async(req:Request, res:Response, next) => {
                const folderService = new FolderService();
                let orQuery = { userId: req['user'].id,name:req.body.name }
                let event = await folderService.findOne(orQuery)
                if(!event){
                    next()
                }
                else{
                var errors = {
                    success: false,
                    msg: `${req.body.name} folder already exist`,
                    status: 400
                };
                Sender.errorSend(res, errors);
                return;
            }
                })
        )
    }

     validateFolderUpdate() {
        return (
            compose()
                .use((req:Request, res:Response, next) => {
                    super.validateUpdateFolder(req.body)
                        .then(data => {
                            next();                            
                        }).catch(error => {   
                            var errors = {
                                success: false,
                                msg: error.details[0].message,
                                data: error.name,
                                status: 400
                            };
                            Sender.errorSend(res, errors);
                            return;
                        })
                })
                .use(async (req:Request, res:Response, next) => {
                    const folderService = new FolderService();
                    let event = await folderService.findOne({ id: req.params.id, userId: req['user'].id })
                    if (event == null) {
                        Sender.errorSend(res, { success: false, status: 409, msg: "Only Folder owner can update folder" })
                    } else {
                        next();
                    }
                })
         )
    }

}

