import { Router, Response, NextFunction } from 'express';
import { Controller } from '@cc/faas/interfaces/controller.interface';
import { functionModel } from '@cc/faas/models/function.model';
import { authMiddleware } from '@cc/faas/middleware/auth.middleware';
import { RequestWithUser } from '@cc/faas/interfaces/requestWithUser.interface';
import { FunctionNotFoundException } from '@cc/faas/exceptions/FunctionException';

export class FunctionController implements Controller {
    public path = '/function';
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/:id`, authMiddleware, this.getFunction);
    }

    private getFunction = async (request: RequestWithUser, response: Response, next: NextFunction) => {
        const id = request.params.id;
        const userFunctionQuery = functionModel.findById(id);
        const userFunction = await userFunctionQuery;
        if (userFunction) {
            response.send(userFunction);
        } else {
            next(new FunctionNotFoundException());
        }
    }
}