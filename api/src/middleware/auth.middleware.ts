import { NextFunction, Response } from "express";
import { RequestWithUser } from "@cc/faas/interfaces/requestWithUser.interface";
import { UserNotFoundException } from "@cc/faas/exceptions/UserException";
import { User } from "@cc/faas/interfaces/user.interface";

export async function authMiddleware(
  request: RequestWithUser,
  response: Response,
  next: NextFunction
) {
  const username = request.headers["x-consumer-username"] ?? "";
  if (!username) {
    next(new UserNotFoundException());
    return;
  }
  request.user = { username } as User; 
  next();
}

