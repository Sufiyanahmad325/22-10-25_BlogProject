import mongoose from "mongoose";


let DbConnection = async () => {
  try {
     let info = await mongoose.connect(process.env.MONGODB_URL)
     console.log(` MONGODB connection !! DB Host ==> ${info.connection.host}`)
  } catch (error) {
    console.log('connection Faild ' + error.message)
  }
}  



export default DbConnection