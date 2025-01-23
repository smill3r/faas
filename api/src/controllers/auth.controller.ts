import { AuthenticationCredentialsException } from '@cc/faas/exceptions/AuthenticationException';
import { Controller } from '@cc/faas/interfaces/controller.interface';
import { User } from '@cc/faas/interfaces/user.interface';
import { axiosGet, axiosPut } from '@cc/faas/services/apiAdmin';
import { NextFunction, Request, Response, Router } from 'express';
import { UserModel } from '@cc/faas/models/user.model';

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

        try {
            await axiosGet(`/consumers/${username}`);
            response.json({ 'message': 'Username not available' });
            return;
        } catch(e) {}
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
        const newUser = new UserModel(user);
        await newUser.save();
        response.json({ user });
    }
}