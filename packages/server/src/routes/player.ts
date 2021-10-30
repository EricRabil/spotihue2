import { APIResponse, ErrorResponse } from "er-expresskit";
import { Router } from "express";
import { HuePlayer } from "../player";
import { assertedActivity } from "../player/activity";
import ajv from "ajv";

export const PlayerRoutes = Router();

PlayerRoutes.get(
    "/",
    (req, res) => {
        APIResponse.json({
            player: HuePlayer.json
        }).send(res);
    }
);

PlayerRoutes.post(
    "/activity",
    async (req, res) => {
        const activity = assertedActivity(req.body);

        await HuePlayer.setActivity(activity);

        APIResponse.json({
            player: HuePlayer.json
        }).send(res);
    }
);

PlayerRoutes.delete("/activity", async (req, res ) => {
    await HuePlayer.setActivity(null);

    APIResponse.json({
        player: HuePlayer.json
    }).send(res);
});

PlayerRoutes.post("/command", async (req, res) => {
    const { endpoint, value } = req.body;

    if (!["resume", "pause", "skip_next", "skip_prev", "seek_to"].includes(endpoint)) throw ErrorResponse.status(400).message("Invalid command");
    if (typeof value !== "undefined" && endpoint !== "seek_to") throw ErrorResponse.status(400).message("Value can only be supplied for seek_to");
    if (endpoint === "seek_to" && typeof value !== "number") throw ErrorResponse.status(400).message("Value must be a number for seek_to");

    await HuePlayer.activityPlayer.sendCommand(endpoint, endpoint === "seek_to" ? { value } : {});

    APIResponse.json({
        player: HuePlayer.json
    }).send(res);
});