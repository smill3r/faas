import * as mongoose from 'mongoose';
import { Function } from '@cc/faas/interfaces/function.interface';

const functionSchema = new mongoose.Schema(
    {
        _id: String,
        name: String,
    },
    {
        toJSON: {
            getters: true,
        },
    },
);
export const functionModel = mongoose.model<Function & mongoose.Document>('Function', functionSchema);