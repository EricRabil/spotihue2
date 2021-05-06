import { APIResponse } from "er-expresskit";
import { Router } from "express";
import { HuePlayer } from "../player";
import { assertedActivity } from "../player/activity";

export const PlayerRoutes = Router();

PlayerRoutes.get("/", (req, res) => {
    APIResponse.json({
        player: HuePlayer.json
    }).send(res);
});

PlayerRoutes.post("/activity", async (req, res) => {
    const activity = assertedActivity(req.body);

    await HuePlayer.setActivity(activity);

    APIResponse.json({
        player: HuePlayer.json
    }).send(res);
});

PlayerRoutes.delete("/activity", async (req, res) => {
    await HuePlayer.setActivity(null);

    APIResponse.json({
        player: HuePlayer.json
    }).send(res);
});