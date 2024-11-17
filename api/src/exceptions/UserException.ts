import HttpException from '@cc/faas/exceptions/HttpException';

export class UserNotFoundException extends HttpException {
    constructor(id: string) {
        super(404, `User with id ${id} not found`);
    }
}