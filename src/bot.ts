import { Battlefield } from "my-vu-rcon";
import * as Discord from "discord.js";
import * as fs from 'fs';
import * as path from 'path';


class Log {
    public static log(type: "ERROR" | "INFO", src: string, msg: string) {
        console.log(`${type}[${src}] ${msg}`);
    }

    public static discord_info(msg: string) {
        this.log("INFO", "DISCORD", msg)
    }
    public static rcon_info(msg: string) {
        this.log("INFO", "RCON", msg)
    }
    public static discord_error(msg: string) {
        this.log("ERROR", "DISCORD", msg)
    }
    public static rcon_error(msg: string) {
        this.log("ERROR", "RCON", msg)
    }

    public static bot_error(msg: string) {
        this.log("ERROR", "BOT", msg)
    }

    public static bot_info(msg: string) {
        this.log("INFO", "BOT", msg)
    }
}



export class Bot {
    public mapmap: any = { "MP_001": "Grand Bazaar", "MP_003": "Tehran Highway", "MP_007": "Caspian Border", "MP_011": "Seine Crossing", "MP_012": "Operation Firestorm", "MP_013": "Damavand Peak", "MP_017": "Noshahr Canals", "MP_018": "Kharg Island", "MP_Subway": "Operation Metro", "XP1_001": "Strike at Karkand", "XP1_002": "Gulf of Oman", "XP1_003": "Sharqi Peninsula", "XP1_004": "Wake Island", "XP2_Factory": "Scrapmetal", "XP2_Office": "Operation 925", "XP2_Palace": "Donya Fortress", "XP2_Skybar": "Ziba Tower", "XP3_Alborz": "Alborz Mountains", "XP3_Desert": "Bandar Desert", "XP3_Shield": "Armored Shield", "XP3_Valley": "Death Valley", "XP4_FD": "Markaz Monolith", "XP4_Parl": "Azadi Palace", "XP4_Quake": "Epicenter", "XP4_Rubble": "Talah Market", "XP5_001": "Operation Riverside", "XP5_002": "Nebandan Flats", "XP5_003": "Kiasar Railroad", "XP5_004": "Sabalan Pipeline" };
    public config = {
        rcon: { host: "", port: 0, password: "", timeout: 5000, maxattempts: 0, retryinterval: 1000, retryincrease: 0 },
        discord: { token: "" },
        display: { usemapname: true, servercallsign: "beer&Rush", refreshInterval: 15000, instantupdate: true }
    }

    public rcon: Battlefield = null;
    public client: Discord.Client = new Discord.Client();

    public async init() {
        Log.bot_info("init");
        try {
            Log.bot_info("Load Config");
            await this.loadConfig();
            Log.bot_info("okay");

            Log.bot_info("Connect Discord...");
            await this.connectDiscord();
            Log.bot_info("okay");

            Log.bot_info("Connect Rcon...");
            await this.connectRcon();
            Log.bot_info("okay");

            Log.bot_info("Start interval");
            await this.updatePresence();
            await this.startInterval();
            Log.bot_info("okay");
        } catch (e) {
            Log.bot_error("on init " + e);
        }
    }

    public loadConfig() {

        return new Promise((resolve, reject) => {
            try {
                let a = fs.readFileSync(path.join(__dirname, "config.json"), 'utf8');
                let config = JSON.parse(a);

                if (!config.discord) throw ("missing config.discord");
                this.config.discord.token = config.discord.token;

                if (!config.display) throw ("missing config.display");
                this.config.display.refreshInterval = config.display.refreshInterval || this.config.display.refreshInterval;
                this.config.display.servercallsign = config.display.servercallSign || this.config.display.servercallsign;
                this.config.display.usemapname = config.display.usemapname || this.config.display.usemapname;
                this.config.display.instantupdate =  config.display.instantupdate != null ? config.display.instantupdate : this.config.display.instantupdate;

                //rcon: { host: "", port: 0, password: "", timeout: 5000, maxattempts: 0, retryinterval: 1000, retryincrease: 0 },
                if (!config.rcon) throw ("missing config.rcon");
                this.config.rcon.host = config.rcon.host;
                this.config.rcon.port = config.rcon.port;
                this.config.rcon.password = config.rcon.password;
                this.config.rcon.timeout = config.rcon.timeout || this.config.rcon.timeout;
                this.config.rcon.maxattempts = config.rcon.maxattempts || this.config.rcon.maxattempts;
                this.config.rcon.retryincrease = config.rcon.retryincrease || this.config.rcon.retryincrease;
                this.config.rcon.retryinterval = config.rcon.retryinterval || this.config.rcon.retryinterval;

                let valid =
                    this.config.discord.token &&
                    this.config.rcon.host &&
                    this.config.rcon.port &&
                    this.config.rcon.password;

                if (valid) {
                    resolve();
                } else {
                    reject("invalid config data");
                }
            } catch (e) {
                reject("invalid config data " + e);
            }
        });
    }


    public async connectRcon() {
        this.rcon = await Battlefield.connect({
            host: this.config.rcon.host,
            port: this.config.rcon.port,
            password: this.config.rcon.password,
            timeout: this.config.rcon.timeout
        });

        this.rcon.on("error", (error) => {
            Log.rcon_error(JSON.stringify(error));
        });

        if (this.config.display.instantupdate) {
            this.rcon.on("playerJoin", ({ name }) => this.updatePresence());
            this.rcon.on("playerLeave", event => this.updatePresence());
        }


    }

    public async connectDiscord() {
        await this.client.login(this.config.discord.token);
        this.client.on("ready", () => { Log.discord_info("Ready") });
        this.client.on("error", (error) => { Log.discord_error(JSON.stringify(error)) })
        this.client.on("message", this.onDiscordMessage.bind(this));

    }

    public async onDiscordMessage(msg: Discord.Message) {

    }

    public async rcon_reconnect() {
        clearInterval(this.presence_interval);
        try {
            await this.rcon.reconnect(this.config.rcon.maxattempts, this.config.rcon.retryinterval, this.config.rcon.retryincrease);
            await this.startInterval();
        } catch (e) {
            Log.rcon_error("Failed to reconnect to rcon " + e);
            //notify user of error if discord is still connected
            this.client.user.setPresence({
                status: "dnd",
                activity: { type: "PLAYING", name: "rcon error" }
            });
        }
    }


    public presence_interval: any = 0;
    public async startInterval() {
        if (this.config.display.instantupdate) return;

        clearInterval(this.presence_interval);
        this.presence_interval = setInterval(async () => {
            Log.bot_info("interval update");
            this.updatePresence();
        }, this.config.display.refreshInterval);
    }

    public async updatePresence() {
        let serverInfo:ServerStatus;
        try {
            serverInfo = await this.getServerStats_rcon();
        } catch (e) {
            Log.rcon_error(e);
            this.rcon_reconnect();
            return
        }
        
        
        try {
            await this.setPresence(serverInfo);
        } catch (e) {
            Log.discord_error(e);
            return
        }
    }

    public async getServerStats_rcon():Promise<ServerStatus>{
        let serverInfo = await this.rcon.serverInfo();
        let maxPlayers = Number.parseInt(await this.rcon.get("vars.maxPlayers"));
        let spectatorCount = Number.parseInt(await this.rcon.get("vu.SpectatorCount"));
        return {serverInfo:serverInfo, maxPlayers:maxPlayers, spectatorCount:spectatorCount};
    }

    public async setPresence(serverStatus: ServerStatus) {
        let serverInfo = serverStatus.serverInfo;
        let map = this.mapmap[serverInfo.map];
        if (!map) map = ""
        
        let players = serverInfo.slots - serverStatus.spectatorCount;
        let maxplayers = serverStatus.maxPlayers;

        let name = "";
        if (this.config.display.usemapname && map) {
            name += map;
        } else {
            name += this.config.display.servercallsign;
        }

        name = name.slice(0, 12); //truncate overflow
        name += " | " + players + "/" + maxplayers;
        this.client.user.setPresence({
            status: "online",
            activity: { type: "PLAYING", name: name },
        });
    }

}

interface ServerStatus{
    serverInfo:Battlefield.ServerInfo,
    maxPlayers:number,
    spectatorCount:number
}