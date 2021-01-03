# vu-discord-playercount
show vu player count in discord
<br>
might work with a normal bf3 server have not tested :/


# Configuration
Configure it using the config file located at app/config.json
<pre>
{
    "rcon": {
        "host": "",
        "port": ,
        "password": "",
        "timeout":10000,
        "maxattempts": 0, //infinte retry
        "retryinterval": 1000,
        "retryincrease": 0 //increase interval by this amount every retry
    },
    "discord": {
        "token": ""
    },
    "display": {
        "usemapname": true,
        "servercallsign": "Beer&Rush",
        "refreshInterval": 15000,
        "instantupdate":false
    }
}
</pre>

<br>
<br>

# helpful links<br>
  How to <a href="https://support.discordapp.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-"> get a userid</a>
  <br>
  How to <a href="https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token/">get a token</a> 
