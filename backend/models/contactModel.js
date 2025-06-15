const {getDB}=require('../config/db');

const getContactCollection=()=>{
    return getDB().collection('contacts');
}

module.exports={getContactCollection};