const {getDB}=require('../config/db');

const getUserCollection=()=>{
    return getDB().collection('users');
}

module.exports={getUserCollection};
