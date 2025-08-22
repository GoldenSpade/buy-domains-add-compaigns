import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3000

app.use(cors())

// Увеличиваем лимит для загрузки изображений и видео (50MB для JSON и URL-encoded данных)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

import namecheapRoutes from './routes/namecheap.js'
import sedoRoutes from './routes/sedo.js'
import clickflareRoutes from './routes/clickflare.js'
import tonicRoutes from './routes/tonic.js'
import chatgptRoutes from './routes/chatgpt.js'
import googleAdsRoutes from './routes/google-ads.js'
import tiktokRoutes from './routes/tiktok.js'

app.use('/', namecheapRoutes)
app.use('/', sedoRoutes)
app.use('/', clickflareRoutes)
app.use('/', tonicRoutes)
app.use('/', chatgptRoutes)
app.use('/', googleAdsRoutes)
app.use('/tiktok', tiktokRoutes)

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
