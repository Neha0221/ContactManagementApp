const {connectDB}=require('./config/db');
const http=require('http');
const authRoute = require('./routes/authRoutes');
const {contactRoute} = require('./routes/contactRoutes');
require('dotenv').config();

const PORT = process.env.PORT || 5001;

const server=http.createServer(async(req,res)=>{
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        return res.end();
    }

    let body='';
    req.on('data',chunk=>(body+=chunk));
    req.on('end', async()=>{
        try {
            if(req.url.startsWith('/auth/register') || req.url.startsWith('/auth/login')){
                return await authRoute(req,res,body);
            }

            if(req.url.startsWith('/contacts')){
                return await contactRoute(req,res,body);
            }

            res.statusCode=404;
            res.end(JSON.stringify({error:'Route not found'}));
        } catch (error) {
            console.error('Server error:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({error: 'Internal server error'}));
        }
    });

    req.on('error', (error) => {
        console.error('Request error:', error);
        res.statusCode = 400;
        res.end(JSON.stringify({error: 'Bad request'}));
    });
});

connectDB().then(()=>{
    server.listen(PORT,()=>{
        console.log(`Server running on port ${PORT}`);
        console.log('MongoDB connected successfully');
    });
}).catch(error => {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
});
