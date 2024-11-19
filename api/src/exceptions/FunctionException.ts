import HttpException from '@cc/faas/exceptions/HttpException';

export class FunctionNotFoundException extends HttpException {
    constructor() {
        super(404, `Function not found`);
    }
}