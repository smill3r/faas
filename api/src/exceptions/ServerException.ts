import HttpException from '@cc/faas/exceptions/HttpException';

export class ServerException extends HttpException {
    constructor() {
        super(500, 'Internal Server Error');
    }
}