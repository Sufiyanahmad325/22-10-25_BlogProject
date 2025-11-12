import express, { urlencoded } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import router from './routes/user.routes.js'

const app = express()

app.use(express.json({limit:'16kb'}))
app.use(express.urlencoded({extended:true , limit:"16kb"}))
app.use(express.static('public'))

app.use(cors({
    origin: [
      process.env.CORS_ORIGIN,
      'http://localhost:8081',          // web mode (Expo web)
      'http://10.140.25.102:8081',     // Expo DevTools on LAN
      'exp://10.140.25.102:8081'       // Expo Go app (Android)
    ],
    credentials: true
  }));
app.use(cookieParser())

app.use('/api/v1/users/' , router )




export default app