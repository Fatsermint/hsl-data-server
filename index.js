const express = require('express')
const cors = require("cors")
const fs = require("node:fs")
const mqtt = require("mqtt")


const app = express()
app.use(cors())
const port = 3002

let writeRequested = false

let data = {
    stats: {
        doorOpen: 0,
        doorClose: 0,
    },
    maxSpeed: {
        route: null,
        speed: -1
    },
    lightRequest: {
        request: 0,
        response: 0
    }
}

fs.readFile("data.json", (err, newdata) => {
    if (newdata) {
        data = { ...data, ...JSON.parse(newdata) }
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
app.get("/stats", (req, res) => {
    res.json(data)
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})



const client = mqtt.connect("wss://mqtt.hsl.fi/");



client.on("connect", () => {
    client.subscribe("/hfp/v2/journey/ongoing/+/#", (err) => {
        if (err) return console.error("FAILED TO CONNECT", err)

    });
});


function handleMessage(topic, type, message) {

    const [_, prefix, version, journey_type, temporal_type, event_type, transport_mode, operator_id, vehicle_number, route_id, direction_id, headsign, start_time, next_stop, geohash_level, geohash, sid] = topic.split("/")
    if (message.spd > data.maxSpeed.speed) {
        const modeBlacklist = ["train", "metro"]
        if (!modeBlacklist.some(mode => mode == transport_mode)) {
            data.maxSpeed.route = message.route
            data.maxSpeed.speed = message.spd
            console.log(message.spd, message.route)
        }

    }

    switch (type) {
        case "DOO":
            data.stats.doorOpen++
            break;

        default:
            break;
    }
    switch (type) {
        case "TLR":
            data.lightRequest.request++
            break;

        default:
            break;
    }
    switch (type) {
        case "TLA":
            data.lightRequest.response++
            break;

        default:
            break;
    }
    if (!writeRequested) writeRequested = true
}
setInterval(() => {
    if (!writeRequested) return
    console.log("writing data")
    fs.writeFile("data.json", JSON.stringify(data), (err) => { })
}, 5_000)