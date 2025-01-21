import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

const UserSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    functions: [{
        type: Schema.Types.ObjectId,
        ref: 'Function'
    }]
});

export const UserModel = mongoose.model('User', UserSchema);