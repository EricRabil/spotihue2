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

Object.assign(process.env, dotenv.config());

createConnection({
    ...env_namespace("DB"),
    entities: [
        resolve(__dirname, "entities", "*.js")
    ]
} as unknown as ConnectionOptions).then(async () => {
    const app = setupExpress(app => {
        app.use("/api/v1/hue", HueRoutes);
        app.use("/api/v1/spotify", SpotifyRoutes);
        app.use("/api/v1/player", PlayerRoutes);
    });
    
    const API_PORT = +process.env.SPOTIHUE_API_PORT! || 9282;
    
    const server = await new Promise<http.Server>(resolve => {
        const server = app.listen(API_PORT, () => resolve(server));
    });

    log("App listening on %d", API_PORT);

    const teardown = () => {
        server.close();
    }

    process.on("SIGINT", () => teardown());
    process.on("beforeExit", () => teardown());
})