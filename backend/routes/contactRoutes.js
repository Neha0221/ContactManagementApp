const {getAllContact,getContact,createContact,updateContact,deleteContact}=require('../controllers/contactController');
const {verifyToken}=require('../middlewares/authMiddleware');
const { getContactCollection } = require('../models/contactModel');
const { getUserCollection } = require('../models/userModel');

const contactRoute=async (req,res,body)=>{
    const userId=verifyToken(req);
    if (!userId) {
        res.statusCode = 403;
        return res.end(JSON.stringify({ error: 'Invalid or missing token' }));
    }

    if(req.method==='GET' && req.url==='/contacts/profile'){
        try {
            const users = getUserCollection();
            const user = await users.findOne({ _id: new ObjectId(userId) });
            if (!user) {
                res.statusCode = 404;
                return res.end(JSON.stringify({ error: 'User not found' }));
            }
            return res.end(JSON.stringify({ 
                contact: {
                    name: user.name,
                    email: user.email
                }
            }));
        } catch (error) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: 'Failed to fetch user profile' }));
        }
    }

    if(req.method==='GET' && req.url==='/contacts'){
        return getAllContact(req,res,userId);
    }

    
    if(req.method==='GET' && req.url.startsWith('/contacts/')){
        const contactId=req.url.split('/')[2];
        return getContact(req,res,userId,contactId);
    }

    if(req.method==='POST' && req.url==='/contacts'){
        return createContact(req,res,userId,body);
    }

    if(req.method==='PUT' && req.url.startsWith('/contacts/')){
        const contactId=req.url.split('/')[2];
        return updateContact(req, res, userId, contactId, body);
    }

    if(req.method==='DELETE' && req.url.startsWith('/contacts/')){
        const contactId=req.url.split('/')[2];
        return deleteContact(req, res, userId, contactId);
    }

}

module.exports={contactRoute};
