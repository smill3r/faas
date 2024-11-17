import * as mongoose from 'mongoose';
import { User } from '@cc/faas/interfaces/user.interface';

const userSchema = new mongoose.Schema(
    {
        _id: String,
        firstName: String,
        lastName: String,
        username: String,
        password: String,
    },
    {
        toJSON: {
            getters: true,
        },
    },
);
export const userModel = mongoose.model<User & mongoose.Document>('User', userSchema);