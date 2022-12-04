# CyrkBot

Bot discord créé sur mon temps libre pour m'amuser. Celui permet un systeme d'archivage et de log de channels d'un serveur en renvoyant tous les messages dans un autre serveur, "copie" du premier.

Nécessite une BDD SQL avec 3 tables et un accès en lecture et ecriture (SELECT, UPDATE, INSERT):
```
[SaveBotChannels]
    originId, varchar(20), primary
    destId, varchar(20)
    lalastRegisteredMessageId, varchar(20)

[SaveBotMessages]
    messageId, varchar(20), primary
    channelId, varchar(20)
    saveId, varchar(20)
[SaveBotServers]
    originId, varchar(20), primary	// ID du serveur a sauvegarder
    destId, varchar(20)			// ID du serveur sur lequel faire la sauvegarde
    active, int(3), default value=1	// Est ce que le bot prend en compte cette ligne
    name, varchar(32)			// Nom du serveur pour l'identifier plus facilement
    roulette, int(10), default value=0	// Pour un minijeu du bot
```
Il faut editer `local.js` avec les informations correspondantes

```js
exports.bot = {
	TOKEN : "aaaaaaaaaaaaaaaaaaaaaaaa.bbbbbb.ccccccccccccccccccccccccccc",  //Token du bot fournis par discord
	BOTID : "000000000000000000",                                           //ID du bot
};

exports.db = {
        HOST : "localhost",
        USER : "USERNAME",
        PSWD : "PASSWORD",
        DDB  : "UserDB"
};

exports.prefix = "?";                                                       //Prefixe de commande du bot
```
## Installation par defaut:

Installer avec
`npm install`

Executer avec
`node CyrkBot.js` ou `npm run start`

## Installer avec Docker

Construire le container avec: 
`docker build --tag cyrkbot .`

Lancer le container avec:
`docker compose up [-d]`
