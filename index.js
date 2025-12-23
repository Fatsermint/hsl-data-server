const express = require('express')
const cors = require("cors")
const fs = require("node:fs")
const mqtt = require("mqtt")


const app = express()
app.use(cors())
const port = 3000

let data = {
    stats: {
        doorOpen: 0,
        doorClose: 0
    }
}

fs.readFile("data.json", (err, newdata) => {
    if (newdata) {
        data = JSON.parse(newdata)
    }
    client.on("message", (topic, message) => {
        const data = JSON.parse(message.toString())
        const [type, messageData] = Object.entries(data)[0]
        handleMessage(topic, type, messageData)
    });
})

app.get('/', (req, res) => {
    res.json({
        api: "HSL Data Api"
    })
})
app.get("/dooropen", (req, res) => {
    res.json({
        door_open: data.stats.doorOpen
    }
    )
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})



const client = mqtt.connect("wss://mqtt.hsl.fi/");



client.on("connect", () => {
    client.subscribe("/hfp/v2/journey/ongoing/doo/#", (err) => {
        if (err) return console.error("FAILED TO CONNECT", err)

    });
});


function handleMessage(topic, type, message) {
    console.log("message: ", type)
    switch (type) {
        case "DOO":
            data.stats.doorOpen++
            break;

        default:
            break;
    }
    fs.writeFile("data.json", JSON.stringify(data), (err) => { })
}