import HueStream, { Frame, DTLS, Light } from "phea.js";
import { Duplex } from "stream";

const MOCK_LIGHTS = [
    0,1,2,3,4,5,6,7,8,9
];

class MockDTLS extends DTLS {
    public static async make(hue: any, groupID: any, options: any) {
        return new MockDTLS(null!, MOCK_LIGHTS, [], "", {
            host: "SIMULATOR",
            username: "SIMULATOR",
            psk: "SIMULATOR"
        })
    }

    async doConnect() {
        this.socket = new class extends Duplex {
            #open = true;
            #mtu = 1200;

            _read() {

            }

            close() {
                this.#open = false;
            }

            alpnProtocol = "nothing";

            setMTU(mtu: number) {
                this.#mtu = mtu;
            }

            getMTU() {
                return this.#mtu;
            }

            setTimeout(timeout: number, callback?: Function): void {}
        }
    }

    async sendFrames(frames: Frame[]): Promise<void> {
        if (!this.running) throw new Error("Socket not running");
        this.emit("frames", frames);
        this.sequenceNumber++;
    }

    async setActive(active: boolean) {
        this.running = active;
    }
}

export class MockHueStream extends HueStream {
    public static async make(options: {}) {
        return new MockHueStream({
            updateFrequency: 60,
            lights: MOCK_LIGHTS.map(lightID => {
                const light = new Light();

                light.id = lightID;

                return light;
            }),
            engine: await MockDTLS.make(null, null, null),
            api: {} as any,
            auth: {} as any,
            group: "0"
        })
    }
}