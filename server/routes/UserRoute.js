import express from 'express';
import { register } from '../controllers/UserController.js';

const userRouter = express.Router();

userRouter.post('/register', register)

export default userRouter;