import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chatRoutes.js';
import uniServerChatRoutes from './routes/uniServerChatRoutes.js';

const app = express();
app.use(express.json());
app.use(cors());

app.get('/health',(req,res)=>{
    return res.status(200).json({message:"Server is working fine!"});
})

app.use('/chat',chatRoutes);
app.use('/chat1',uniServerChatRoutes);

const PORT = 8080;

app.listen(PORT, ()=>{
    console.log(`Server is running at PORT: ${PORT}`)
})
