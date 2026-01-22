import { Router } from 'express';
import { ParentController } from './parent.controller.impl';

const adminRouter = Router();
const parentController = new ParentController();

adminRouter.use('/', parentController.getRouter());

export { adminRouter };
