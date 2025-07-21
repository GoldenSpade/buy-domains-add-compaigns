import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

import namecheapRoutes from './routes/namecheap.js'
import sedoRoutes from './routes/sedo.js'
import clickflareRoutes from './routes/clickflare.js'
import tonicRoutes from './routes/tonic.js'

app.use('/', namecheapRoutes)
app.use('/', sedoRoutes)
app.use('/', clickflareRoutes)
app.use('/', tonicRoutes)

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`)
})
