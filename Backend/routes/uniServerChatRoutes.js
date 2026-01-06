import express from 'express';
const router = express.Router();

const clients = new Map()

router.get('/stream',(req,res)=>{
    const clientId = req.query.clientId || Math.random().toString(36).substring(7);

    console.log(clientId);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.flushHeaders();

    // Sending initial connection event
    res.write(`data: ${JSON.stringify({
        type: 'connected',
        clientId: clientId,
        message: 'Connected to chat stream'
    })}\n\n`);
    
    // Storing this client's connection
    clients.set(clientId, {
        id: clientId,
        res: res,
        connectedAt: new Date()
    });

    console.log(`[${clientId}] Connected. Total clients: ${clients.size}`);
    
    // Keep-alive heartbeat (every 30 seconds)
    const heartbeat = setInterval(() => {
        res.write(`:heartbeat ${new Date().toISOString()}\n\n`);
    }, 30000);
    
    // Handle client disconnect
    req.on('close', () => {
        clearInterval(heartbeat);
        clients.delete(clientId);
        console.log(`[${clientId}] Disconnected. Total clients: ${clients.size}`);
    });
} );


router.post('/broadcast',express.json(),(req,res)=>{
    const { message, user = 'Anonymous', type = 'message' } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }


    const eventData = {
        type: type,
        user: user,
        message: message,
        timestamp: new Date().toISOString()
    };

    console.log(`Broadcasting to ${clients.size} clients:`, eventData);
    
    let successCount = 0;
    let failCount = 0;

    clients.forEach((client, clientId) => {
        try {
            client.res.write(`data: ${JSON.stringify(eventData)}\n\n`);
            successCount++;
            console.log(`  ✓ Sent to ${clientId}`);
        } catch (error) {
            console.error(`  ✗ Failed to send to ${clientId}:`, error.message);
            clients.delete(clientId); // Remove dead connections
            failCount++;
        }
    });

    return res.status(200).json({
        success: true,
        sent: successCount,
        failed: failCount,
        totalClients: clients.size
    });
});


// Get list of active clients
router.get('/clients', (req, res) => {
    const clientList = Array.from(clients.values()).map(client => ({
        id: client.id,
        connectedAt: client.connectedAt,
        duration: Math.floor((Date.now() - client.connectedAt.getTime()) / 1000) + 's'
    }));
    
    return res.status(200).json({
        total: clients.size,
        clients: clientList
    });
});


export default router;