import express from 'express';
export const resourceRouter = express.Router();

import { Resources } from './resources.controller';
let resources_controller = new Resources();

resourceRouter.get('/images/:filename', resources_controller.public_image_get);

resourceRouter.get('/css/:filename', resources_controller.public_css_get);
