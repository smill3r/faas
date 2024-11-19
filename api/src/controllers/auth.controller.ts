import { Router, Request, Response, NextFunction } from 'express';
import { Controller } from '@cc/faas/interfaces/controller.interface';
import { AuthenticationCredentialsException } from '@cc/faas/exceptions/AuthenticationException';
import { User } from '@cc/faas/interfaces/user.interface';
import { axiosPut } from '@cc/faas/services/apiAdmin';

export class AuthController implements Controller {
    public path = '/auth';
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(`${this.path}/register`, this.register);
    }

    private register = async (request: Request, response: Response, next: NextFunction) => {
        const username = request.body.username as string;
        const password = request.body.password as string;
        if (!username || !password) {
            next(new AuthenticationCredentialsException());
        }
        const userData = {
            username,
            plugins: {
                'basic-auth': {
                    username,
                    password
                }
            }
        };
        const res = await axiosPut('/consumers', userData);
        const user = {
            username: res.data.value.username
        } as User;
        response.json({ user });
    }
}