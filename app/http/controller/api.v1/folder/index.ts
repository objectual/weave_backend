import express from 'express';
import { FolderValidationMiddleware } from '../../../validators/folder.validate';
const router = express.Router();
import { Folders } from './folder.controller'
class EventRoutes {
    get routes() {
        router.get('/', new Folders().getFolders)
 
        router.post('/', FolderValidationMiddleware.validateFolderCreate(),new Folders().createFolder)

        router.patch('/:id',FolderValidationMiddleware.validateFolderUpdate(),new Folders().updateFolder)

        router.delete('/:id', new Folders().deleteFolder)

        return router;
    }
}
Object.seal(EventRoutes);
export default EventRoutes;