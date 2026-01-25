import { Router } from 'express';
import { ParentController } from './parent.controller.impl';
import { ParentService } from './parent.service';
import { DatabaseService } from '../database/interface/database.service';
import { authService } from '../auth/auth.service';

const adminRouter = Router();

const databaseService = new DatabaseService();
const parentService = new ParentService(databaseService, authService);
const parentController = new ParentController(parentService);

adminRouter.use('/', parentController.getRouter());

export { adminRouter, parentController, parentService, databaseService };
