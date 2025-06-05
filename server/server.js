import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import connectDB from './configs/db.js';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 4000;

await connectDB();

// allow multiple origins
const allowedOrigins = ['http://localhost:5173']

// Middleware configuration
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: allowedOrigins, Credentials: true}));

app.get('/',(req,res) => res.send("Api is working"));

app.listen(port, () => {
    console.log(`server is running on http://localhost:${port}`);
})