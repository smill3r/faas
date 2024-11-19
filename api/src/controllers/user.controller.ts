import { Router, Response, NextFunction } from 'express';
import { Controller } from '@cc/faas/interfaces/controller.interface';
import { authMiddleware } from '@cc/faas/middleware/auth.middleware';
import { RequestWithUser } from '@cc/faas/interfaces/requestWithUser.interface';

export class UserController implements Controller {
    public path = '/user';
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/me`, authMiddleware, this.getUser);
    }

    private getUser = async (request: RequestWithUser, response: Response, next: NextFunction) => {
        response.json({ user: request.user });
    }
}