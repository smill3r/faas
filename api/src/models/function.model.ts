import * as mongoose from 'mongoose';
import { Function } from '@cc/faas/interfaces/function.interface';

const functionSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // ID único
    name: { type: String, required: true }, // Nombre de la función
    userId: { type: String, required: true }, // ID del usuario que registró la función
    dockerImage: { type: String, required: true }, // Imagen Docker asociada
    createdAt: { type: Date, default: Date.now }, // Fecha de creación
  },
  {
    toJSON: {
      getters: true,
    },
  }
);

export const functionModel = mongoose.model<Function & mongoose.Document>(
  'Function',
  functionSchema
);
