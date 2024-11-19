import HttpException from '@cc/faas/exceptions/HttpException';

export class UserNotFoundException extends HttpException {
    constructor() {
        super(404, `User not found`);
    }
}