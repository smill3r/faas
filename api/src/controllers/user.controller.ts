import { Router, Response, NextFunction } from 'express';
import { Controller } from '@cc/faas/interfaces/controller.interface';
import { userModel } from '@cc/faas/models/user.model';
import { UserNotFoundException } from '@cc/faas/exceptions/UserException';
import { authMiddleware } from '@cc/faas/middleware/auth.middleware';
import { RequestWithUser } from '@cc/faas/interfaces/requestWithUser.interface';

export class UserController implements Controller {
    public path = '/user';
    public router = Router();
    private user = userModel;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/me`, this.getUser);
        this.router.get(`${this.path}/:id`, this.getUserById);
    }

    private getUser = async (request: RequestWithUser, response: Response, next: NextFunction) => {
        response.json({ message: 'user' });
    }

    private getUserById = async (request: RequestWithUser, response: Response, next: NextFunction) => {
        const id = request.params.id;
        const userQuery = this.user.findById(id);
        const user = await userQuery;
        if (user) {
            response.send(user);
        } else {
            next(new UserNotFoundException(id));
        }
    }
}