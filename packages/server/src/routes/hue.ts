import { HueStream } from "phea.js";
import { Router } from "express";
import { APIResponse, ErrorResponse, Validatable } from "er-expresskit";
import { IsArray, IsIP } from "class-validator";
import { HueBridge } from "../entities/HueBridge";
import { assertUUID } from "../util/validation";

export const HueRoutes = Router();

HueRoutes.get("/discover", async (req, res) => {
    const bridges = await HueStream.discover();

    APIResponse.json({ bridges }).send(res);
});

class PairingRequest extends Validatable<{ ip: string }> {
    @IsIP()
    ip: string;

    static asserted(body: any) {
        return new this(body, ["ip"]).asserted;
    }
}

HueRoutes.post("/discover/pair", async (req, res) => {
    const { ip } = PairingRequest.asserted(req.body);

    if ((await HueBridge.count({ ip })) > 0) throw ErrorResponse.status(409).message("A bridge with that IP already exists").error;

    try {
        const { username, psk } = await HueStream.register(ip);

        const { json: bridge } = await HueBridge.create({ ip, username, psk }).save();

        APIResponse.json({ bridge }).send(res);
    } catch (e) {
        if (e instanceof Error && e.message) {
            throw ErrorResponse.status(400).message(e.message).error;
        }

        throw e;
    }
});

HueRoutes.get("/bridges", async (req, res) => {
    const bridges = await HueBridge.find();

    APIResponse.json({ bridges: bridges.map(bridge => bridge.json) }).send(res);
});

HueRoutes.get("/bridges/:bridgeID", async (req, res) => {
    const bridge = await HueBridge.findOne({ uuid: assertUUID(req.params.bridgeID) });

    if (!bridge) throw ErrorResponse.status(404).message("Bridge not found").error;

    APIResponse.json({ bridge: bridge.json }).send(res);
});

HueRoutes.get("/bridges/:bridgeID/lights", async (req, res) => {
    const bridge = await HueBridge.findOne({ uuid: assertUUID(req.params.bridgeID) });

    if (!bridge) throw ErrorResponse.status(404).message("Bridge not found").error;

    const lights = await HueStream.lights({
        host: bridge.ip,
        username: bridge.username,
        psk: bridge.psk
    });

    APIResponse.json({ lights: lights.map(light => light._data) }).send(res);
});

class NewGroupRequest extends Validatable<{ lights: (string | number)[] }> {
    @IsArray()
    lights: (string | number)[];
}

HueRoutes.post("/bridges/:bridgeID/group", async (req, res) => {
    const bridge = await HueBridge.findOne({ uuid: assertUUID(req.params.bridgeID) });

    if (!bridge) throw ErrorResponse.status(404).message("Bridge not found").error;

    const { lights } = new NewGroupRequest(req.body, ["lights"]).asserted;

    const group = await HueStream.createGroup({
        host: bridge.ip,
        username: bridge.username,
        psk: bridge.psk
    }, lights);

    bridge.groupID = group;
    await bridge.save();

    APIResponse.json({ bridge: bridge.json }).send(res);
});