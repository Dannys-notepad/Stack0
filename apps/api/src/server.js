import app from '#app.js'
import env from '#config/env.js'

const PORT = env.port

app.listen( PORT, () => {
    console.log(`Stack0 server running on port ${PORT}  \n`)
})