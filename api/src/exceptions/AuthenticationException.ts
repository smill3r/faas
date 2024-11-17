import HttpException from '@cc/faas/exceptions/HttpException';

export class AuthenticationCodeMissingException extends HttpException {
    constructor() {
        super(400, 'Authentication code missing');
    }
}

export class AuthenticationTokenMissingException extends HttpException {
    constructor() {
        super(401, 'Failed to obtain access token');
    }
}