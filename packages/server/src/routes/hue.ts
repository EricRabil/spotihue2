import { HueStream } from "phea.js";
import { Router } from "express";
import { APIResponse, assertValid, ErrorResponse, Validatable } from "er-expresskit";
import { IsArray, IsIP, IsOptional, IsString, MaxLength } from "class-validator";
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

    @IsOptional()
    @IsString()
    @MaxLength(32)
    label: string;
}

HueRoutes.post("/discover/pair", async (req, res) => {
    const { ip, label } = assertValid(PairingRequest, req.body);

    try {
        const { username, psk } = await HueStream.register(ip);

        const { json: bridge } = await HueBridge.create({ ip, label, username, psk }).save();

        APIResponse.json({ bridge }).send(res);
    } catch (e) {
        if (e instanceof Error && e.message) {
            throw ErrorResponse.status(400).message(e.message);
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

    if (!bridge) throw ErrorResponse.status(404).message("Bridge not found");

    APIResponse.json({ bridge: bridge.json }).send(res);
});

class HueEditRequest extends Validatable<{ label: string | undefined | null }> {
    @IsOptional()
    @IsString()
    @MaxLength(32)
    label: string | undefined | null;
}

HueRoutes.patch("/bridges/:bridgeID", async (req, res) => {
    const { label } = assertValid(HueEditRequest, req.body);
    const bridge = await HueBridge.findOne({ uuid: assertUUID(req.params.bridgeID) });

    if (!bridge) throw ErrorResponse.status(404).message("Bridge not found");

    bridge.label = label || null;
    await bridge.save();

    APIResponse.json({ bridge: bridge.json }).send(res);
});

HueRoutes.get("/bridges/:bridgeID/lights", async (req, res) => {
    const bridge = await HueBridge.findOne({ uuid: assertUUID(req.params.bridgeID) });

    if (!bridge) throw ErrorResponse.status(404).message("Bridge not found");

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

    if (!bridge) throw ErrorResponse.status(404).message("Bridge not found");

    const { lights } = assertValid(NewGroupRequest, req.body);

    const group = await HueStream.createGroup({
        host: bridge.ip,
        username: bridge.username,
        psk: bridge.psk
    }, lights);

    bridge.groupID = group;
    await bridge.save();

    APIResponse.json({ bridge: bridge.json }).send(res);
});

HueRoutes.put("/bridges/:bridgeID/group/:groupID", async (req, res) => {
    const bridge = await HueBridge.findOne({ uuid: assertUUID(req.params.bridgeID) });

    if (!bridge) throw ErrorResponse.status(404).message("Bridge not found");

    bridge.groupID = req.params.groupID;
    await bridge.save();

    APIResponse.json({ bridge: bridge.json }).send(res);
});