import dotenv from "dotenv";
import setupExpress from "er-expresskit";
import { HueRoutes } from "./routes/hue";
import { SpotifyRoutes } from "./routes/spotify";
import { log } from "./util/log";
import { ConnectionOptions, createConnection } from "typeorm";
import { env_namespace } from "./util/env-config";
import { resolve } from "path";
import { PlayerRoutes } from "./routes/player";
import http from "http";
import { socketStream } from "./stream";
import { us_listen_socket_close, us_listen_socket } from "uWebSockets.js";
import enableDestroy from "server-destroy";
import { SpotifyShuffler } from "./player/shuffler";
import { HuePlayer } from "./player";
import express from "express";
import path from "path";

Object.assign(process.env, dotenv.config());

createConnection({
    ...env_namespace("DB"),
    entities: [
        resolve(__dirname, "entities", "*.js")
    ]
} as unknown as ConnectionOptions).then(async connection => {
    const app = setupExpress(app => {
        app.use("/api/v1/hue", HueRoutes);
        app.use("/api/v1/spotify", SpotifyRoutes);
        app.use("/api/v1/player", PlayerRoutes);

        app.use(express.static(path.resolve(__dirname, "../../app/build")));

        app.get("*", (req, res) => {
            res.sendFile(path.resolve(__dirname, "../../app/build/index.html"));
        });
    }, {
        disable: {
            notFoundHandler: true
        }
    });
    
    const API_PORT = +process.env.SPOTIHUE_API_PORT! || 9282;
    const STREAM_PORT = +process.env.SPOTIHUE_STREAM_PORT! || 9283;
    
    let server = await new Promise<http.Server>(resolve => {
        const server = app.listen(API_PORT, "0.0.0.0", () => resolve(server));
    });

    enableDestroy(server);

    const sock: us_listen_socket = await new Promise(resolve => socketStream.listen(STREAM_PORT, resolve));

    log("App listening on %d", API_PORT);
    log("Stream listening on %d", STREAM_PORT);

    let tearingDown = false;

    const teardown = async () => {
        if (tearingDown) return;
        tearingDown = true;
        await new Promise(resolve => server.destroy(resolve)).then(() => server = null!);
        us_listen_socket_close(sock);
        await connection.close();
        await HuePlayer.teardown();
        SpotifyShuffler.teardown();
    }

    process.once("SIGINT", () => teardown());
    process.once("beforeExit", () => teardown());
})