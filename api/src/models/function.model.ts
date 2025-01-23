import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import { Function as IFunction } from '@cc/faas/interfaces/function.interface';

const FunctionSchema = new mongoose.Schema(
    {
        name: String,
        image: String,
        description: String,
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }
);
export const FunctionModel = mongoose.model('Function', FunctionSchema);