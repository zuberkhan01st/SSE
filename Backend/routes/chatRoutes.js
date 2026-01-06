import express from 'express';
const router= express.Router();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

router.get('/', async(req,res)=>{
    const msg = `Hello time is ${new Date()}`
    return res.status(200).json({message:"Msg sent",msg})
})


//Stateless Single req oriented lifecycle (Request scoped SSE)
router.post('/send', async(req, res) => {
    const requestId = Math.random().toString(36).substring(7);
    
    console.log(`[${requestId}] Request started`);
    
    res.setHeader('Content-Type','text/event-stream');
    res.setHeader('Cache-Control','no-cache');
    res.setHeader('Connection','keep-alive');
    res.setHeader('x-Accel-Buffering',"no");
    res.flushHeaders();

    console.log(`[${requestId}] Writing "thinking"`);
    res.write(`data: {"type":"status","msg":"Thinking"}\n\n`);
    
    console.log(`[${requestId}] Sleeping 800ms...`);
    await sleep(800);
    
    console.log(`[${requestId}] Writing "Hello"`);
    res.write(`data: {"type":"token","text":"Hello"}\n\n`);
    
    console.log(`[${requestId}] Sleeping 3000ms...`);
    await sleep(3000);
    
    console.log(`[${requestId}] Writing "world"`);
    res.write(`data: {"type":"token","text":" world"}\n\n`);
    
    console.log(`[${requestId}] Done!`);
    res.write(`data: [DONE]\n\n`);
    res.end();
});

//Statefull long range SSE

export default router;