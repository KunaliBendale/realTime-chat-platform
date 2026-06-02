import { cloudinary } from "../config/cloudinary.js";
const uploadOnCloudinary = async(path, options = {})=>{
    const cloudinaryRes = await cloudinary.uploader.upload(path, options)
    return cloudinaryRes;
}

const deletefromCloudinary=async(public_id)=>{
    const cloudinaryResponse=await cloudinary.uploader.destroy(public_id)
    return cloudinaryResponse;
}

export {uploadOnCloudinary,deletefromCloudinary}
