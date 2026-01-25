import { Request, Response } from 'express';

export interface IParentController {
  login(req: Request<any, any, any, any, any>, res: Response<any, any>): Promise<any>;

  validate(req: Request<any, any, any, any, any>, res: Response<any, any>): Promise<any>;

  updateMultiplier(req: Request<any, any, any, any, any>, res: Response<any, any>): Promise<any>;

  updateCredits(req: Request<any, any, any, any, any>, res: Response<any, any>): Promise<any>;

  getUsers(req: Request<any, any, any, any, any>, res: Response<any, any>): Promise<any>;

  getUser(req: Request<any, any, any, any, any>, res: Response<any, any>): Promise<any>;

  get validQuizTypes(): readonly string[];
}
