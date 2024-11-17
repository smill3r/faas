import { NextFunction, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthenticationCodeMissingException, AuthenticationTokenMissingException } from '@cc/faas/exceptions/AuthenticationException';
import { DataStoredInToken } from '@cc/faas/interfaces/dataStoredInToken';
import { RequestWithUser } from '@cc/faas/interfaces/requestWithUser.interface';
import { userModel } from '@cc/faas/models/user.model';

export async function authMiddleware(request: RequestWithUser, response: Response, next: NextFunction) {
    const cookies = request.cookies;
    console.log('request', request);
    if (cookies && cookies.Authorization) {
        const secret = process.env.JWT_SECRET || '';
        try {
            const verificationResponse = jwt.verify(cookies.Authorization, secret) as DataStoredInToken;
            const id = verificationResponse._id;
            const user = await userModel.findById(id);
            if (user) {
                request.user = user;
                next();
            } else {
                next(new AuthenticationCodeMissingException());
            }
        } catch (error) {
            next(new AuthenticationCodeMissingException());
        }
    } else {
        next(new AuthenticationTokenMissingException());
    }
}