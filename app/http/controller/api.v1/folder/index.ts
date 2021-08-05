import express from 'express';
import { FolderValidationMiddleware } from '../../../validators/folder.validate';
const router = express.Router();
import { Folders } from './folder.controller'
class EventRoutes {
    get routes() {
        router.get('/', new Folders().getFolders)

        // router.post('/', EventValidationMiddleware.validateFolderCreate(), new Folders().createFolder)
        
        router.post('/', FolderValidationMiddleware.validateFolderCreate(),new Folders().createFolder)


        // router.put('/:id', EventValidationMiddleware.validateEventUpdate(), new Events().updateEvent)

        // router.delete('/:id', new Events().deleteEvent)

        return router;
    }
}
Object.seal(EventRoutes);
export default EventRoutes;