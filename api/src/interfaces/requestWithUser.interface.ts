import { Request } from 'express';
import { User } from '@cc/faas/interfaces/user.interface';

export interface RequestWithUser extends Request {
    user?: User;
}