import jwt from "jsonwebtoken";
import { Response } from "express";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const verifyToken = (token: string): { userId: string } => {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
};

export const sendTokenResponse = (
  user: any,
  statusCode: number,
  res: Response,
  message: string = "Success",
) => {
  const token = generateToken(user._id);

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      user,
      token,
    },
  });
};

export const clearTokenResponse = (
  res: Response,
  message: string = "Logged out successfully",
) => {
  res.status(200).json({
    success: true,
    message,
  });
};
