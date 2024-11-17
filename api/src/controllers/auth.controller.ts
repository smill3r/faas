import { Router, Request, Response, NextFunction } from 'express';
import { Controller } from '@cc/faas/interfaces/controller.interface';
import { userModel } from '@cc/faas/models/user.model';

export class AuthController implements Controller {
    public path = '/auth';
    public router = Router();
    private user = userModel;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(`${this.path}/register`, this.register);
    }

    private register = async (request: Request, response: Response, next: NextFunction) => {
        // response.json({ message: 'auth' });
        response.send(200);
    }

}