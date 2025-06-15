const {getContactCollection}=require('../models/contactModel');
const {ObjectId} =require('mongodb');

const getAllContact=async (req,res,userId)=>{
    try {
        const contact=getContactCollection();
        const data=await contact.find({userId}).toArray();
        res.end(JSON.stringify({data}));
    } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to fetch contacts' }));
    }
}

const getContact=async (req,res,userId,contactId)=>{
    try {
        if (!ObjectId.isValid(contactId)) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid contact ID format' }));
            return;
        }

        const contact=getContactCollection();
        const data=await contact.find({_id: new ObjectId(contactId), userId}).toArray();
        res.end(JSON.stringify({data}));
    } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to fetch contact' }));
    }
}

const createContact = async (req, res, userId, body) => {
    try {
        const contactData = JSON.parse(body);
        const contacts = getContactCollection();

        // Validate required fields
        if (!contactData.name || !contactData.mobile || !contactData.email) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Name, mobile and email are required' }));
            return;
        }

        // Mobile number validation
        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(contactData.mobile)) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Mobile number must be exactly 10 digits' }));
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactData.email)) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Please enter a valid email address' }));
            return;
        }

        // Check for existing contact with same mobile or email
        const existing = await contacts.findOne({
            userId,
            $or: [
                { mobile: contactData.mobile },
                { email: contactData.email }
            ]
        });

        if (existing) {
            res.statusCode = 409;
            res.end(JSON.stringify({ error: 'Contact with this mobile number or email already exists' }));
            return;
        }

        // Add userId to contact data
        contactData.userId = userId;
        
        // Insert the new contact
        const result = await contacts.insertOne(contactData);
        
        if (!result.acknowledged) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to create contact' }));
            return;
        }

        res.statusCode = 201;
        res.end(JSON.stringify({ message: 'Contact Created Successfully' }));
    } catch (error) {
        console.error('Create contact error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to create contact' }));
    }
};

const updateContact= async(req,res,userId,contactId,body)=>{
    try {
        if (!ObjectId.isValid(contactId)) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid contact ID format' }));
            return;
        }

        const contact=getContactCollection();
        const updatedContact=JSON.parse(body);

        // Mobile number validation
        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(updatedContact.mobile)) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Mobile number must be exactly 10 digits' }));
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updatedContact.email)) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Please enter a valid email address' }));
            return;
        }

        // Check if contact exists
        const existingContact = await contact.findOne({ _id: new ObjectId(contactId), userId });
        if (!existingContact) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Contact not found' }));
            return;
        }

        // Check for duplicate mobile/email with other contacts
        const duplicate = await contact.findOne({
            userId,
            _id: { $ne: new ObjectId(contactId) },
            $or: [
                { mobile: updatedContact.mobile },
                { email: updatedContact.email }
            ]
        });

        if (duplicate) {
            res.statusCode = 409;
            res.end(JSON.stringify({ error: 'Another contact with this mobile number or email already exists' }));
            return;
        }

        await contact.updateOne(
            { _id: new ObjectId(contactId), userId },
            { $set: updatedContact }
        );
        res.end(JSON.stringify({ message: 'Contact updated successfully' }));
    } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to update contact' }));
    }
}

const deleteContact=async(req,res,userId,contactId)=>{
    try {
        if (!ObjectId.isValid(contactId)) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid contact ID format' }));
            return;
        }

        const contact=getContactCollection();
        const result = await contact.deleteOne({ _id: new ObjectId(contactId), userId });
        
        if (result.deletedCount === 0) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Contact not found' }));
            return;
        }

        res.end(JSON.stringify({ message: 'Contact deleted successfully' }));
    } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to delete contact' }));
    }
}

module.exports={getAllContact,getContact,createContact,updateContact,deleteContact};