"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
const my_vu_rcon_1 = require("my-vu-rcon");
const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");
class Log {
    static log(type, src, msg) {
        console.log(`${type}[${src}] ${msg}`);
    }
    static discord_info(msg) {
        this.log("INFO", "DISCORD", msg);
    }
    static rcon_info(msg) {
        this.log("INFO", "RCON", msg);
    }
    static discord_error(msg) {
        this.log("ERROR", "DISCORD", msg);
    }
    static rcon_error(msg) {
        this.log("ERROR", "RCON", msg);
    }
    static bot_error(msg) {
        this.log("ERROR", "BOT", msg);
    }
    static bot_info(msg) {
        this.log("INFO", "BOT", msg);
    }
}
class Bot {
    constructor() {
        this.mapmap = { "MP_001": "Grand Bazaar", "MP_003": "Tehran Highway", "MP_007": "Caspian Border", "MP_011": "Seine Crossing", "MP_012": "Operation Firestorm", "MP_013": "Damavand Peak", "MP_017": "Noshahr Canals", "MP_018": "Kharg Island", "MP_Subway": "Operation Metro", "XP1_001": "Strike at Karkand", "XP1_002": "Gulf of Oman", "XP1_003": "Sharqi Peninsula", "XP1_004": "Wake Island", "XP2_Factory": "Scrapmetal", "XP2_Office": "Operation 925", "XP2_Palace": "Donya Fortress", "XP2_Skybar": "Ziba Tower", "XP3_Alborz": "Alborz Mountains", "XP3_Desert": "Bandar Desert", "XP3_Shield": "Armored Shield", "XP3_Valley": "Death Valley", "XP4_FD": "Markaz Monolith", "XP4_Parl": "Azadi Palace", "XP4_Quake": "Epicenter", "XP4_Rubble": "Talah Market", "XP5_001": "Operation Riverside", "XP5_002": "Nebandan Flats", "XP5_003": "Kiasar Railroad", "XP5_004": "Sabalan Pipeline" };
        this.config = {
            rcon: { host: "", port: 0, password: "", timeout: 5000, maxattempts: 0, retryinterval: 1000, retryincrease: 0 },
            discord: { token: "" },
            display: { usemapname: true, servercallsign: "beer&Rush", refreshInterval: 15000, instantupdate: true }
        };
        this.rcon = null;
        this.client = new Discord.Client();
        this.presence_interval = 0;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            Log.bot_info("init");
            try {
                Log.bot_info("Load Config");
                yield this.loadConfig();
                Log.bot_info("okay");
                Log.bot_info("Connect Discord...");
                yield this.connectDiscord();
                Log.bot_info("okay");
                Log.bot_info("Connect Rcon...");
                yield this.connectRcon();
                Log.bot_info("okay");
                Log.bot_info("Start interval");
                yield this.updatePresence();
                yield this.startInterval();
                Log.bot_info("okay");
            }
            catch (e) {
                Log.bot_error("on init " + e);
            }
        });
    }
    loadConfig() {
        return new Promise((resolve, reject) => {
            try {
                let a = fs.readFileSync(path.join(__dirname, "config.json"), 'utf8');
                let config = JSON.parse(a);
                if (!config.discord)
                    throw ("missing config.discord");
                this.config.discord.token = config.discord.token;
                if (!config.display)
                    throw ("missing config.display");
                this.config.display.refreshInterval = config.display.refreshInterval || this.config.display.refreshInterval;
                this.config.display.servercallsign = config.display.servercallSign || this.config.display.servercallsign;
                this.config.display.usemapname = config.display.usemapname || this.config.display.usemapname;
                this.config.display.instantupdate = config.display.instantupdate != null ? config.display.instantupdate : this.config.display.instantupdate;
                //rcon: { host: "", port: 0, password: "", timeout: 5000, maxattempts: 0, retryinterval: 1000, retryincrease: 0 },
                if (!config.rcon)
                    throw ("missing config.rcon");
                this.config.rcon.host = config.rcon.host;
                this.config.rcon.port = config.rcon.port;
                this.config.rcon.password = config.rcon.password;
                this.config.rcon.timeout = config.rcon.timeout || this.config.rcon.timeout;
                this.config.rcon.maxattempts = config.rcon.maxattempts || this.config.rcon.maxattempts;
                this.config.rcon.retryincrease = config.rcon.retryincrease || this.config.rcon.retryincrease;
                this.config.rcon.retryinterval = config.rcon.retryinterval || this.config.rcon.retryinterval;
                let valid = this.config.discord.token &&
                    this.config.rcon.host &&
                    this.config.rcon.port &&
                    this.config.rcon.password;
                if (valid) {
                    resolve();
                }
                else {
                    reject("invalid config data");
                }
            }
            catch (e) {
                reject("invalid config data " + e);
            }
        });
    }
    connectRcon() {
        return __awaiter(this, void 0, void 0, function* () {
            this.rcon = yield my_vu_rcon_1.Battlefield.connect({
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
        });
    }
    connectDiscord() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.login(this.config.discord.token);
            this.client.on("ready", () => { Log.discord_info("Ready"); });
            this.client.on("error", (error) => { Log.discord_error(JSON.stringify(error)); });
            this.client.on("message", this.onDiscordMessage.bind(this));
        });
    }
    onDiscordMessage(msg) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    rcon_reconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            clearInterval(this.presence_interval);
            try {
                yield this.rcon.reconnect(this.config.rcon.maxattempts, this.config.rcon.retryinterval, this.config.rcon.retryincrease);
                yield this.startInterval();
            }
            catch (e) {
                Log.rcon_error("Failed to reconnect to rcon " + e);
                //notify user of error if discord is still connected
                this.client.user.setPresence({
                    status: "dnd",
                    activity: { type: "PLAYING", name: "rcon error" }
                });
            }
        });
    }
    startInterval() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config.display.instantupdate)
                return;
            clearInterval(this.presence_interval);
            this.presence_interval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                Log.bot_info("interval update");
                this.updatePresence();
            }), this.config.display.refreshInterval);
        });
    }
    updatePresence() {
        return __awaiter(this, void 0, void 0, function* () {
            let serverInfo;
            try {
                serverInfo = yield this.getServerStats_rcon();
            }
            catch (e) {
                Log.rcon_error(e);
                this.rcon_reconnect();
                return;
            }
            try {
                yield this.setPresence(serverInfo);
            }
            catch (e) {
                Log.discord_error(e);
                return;
            }
        });
    }
    getServerStats_rcon() {
        return __awaiter(this, void 0, void 0, function* () {
            let serverInfo = yield this.rcon.serverInfo();
            return serverInfo;
        });
    }
    setPresence(serverInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            let map = this.mapmap[serverInfo.map];
            if (!map)
                map = "";
            let players = serverInfo.slots;
            let maxplayers = serverInfo.totalSlots;
            let name = "";
            if (this.config.display.usemapname && map) {
                name += map;
            }
            else {
                name += this.config.display.servercallsign;
            }
            name = name.slice(0, 12); //truncate overflow
            name += " | " + players + "/" + maxplayers;
            this.client.user.setPresence({
                status: "online",
                activity: { type: "PLAYING", name: name },
            });
        });
    }
}
exports.Bot = Bot;
//# sourceMappingURL=bot.js.map