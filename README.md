# CyrkBot

Bot discord créé sur mon temps libre pour m'amuser. Celui permet un systeme d'archivage et de log de channels d'un serveur en renvoyant tous les messages dans un autre serveur, "copie" du premier.

Nécessite une BDD SQL avec 2 tables et un accès en lecture et ecriture (SELECT, UPDATE, INSERT):
```
[SaveBotChannels]
    originId, varchar(20), primary
    destId, varchar(20)
    lalastRegisteredMessageId, varchar(20)

[SaveBotMessages]
    messageId, varchar(20), primary
    channelId, varchar(20)
    saveId, varchar(20)
```
Il faut editer `local.js` avec les informations correspondantes

```js
exports.bot = {
	TOKEN : "aaaaaaaaaaaaaaaaaaaaaaaa.bbbbbb.ccccccccccccccccccccccccccc",  //Token du bot fournis par discord
	BOTID : "000000000000000000",                                           //ID du bot
	GUILDID : "111111111111111111",                                         //ID du serveur à log
	GUILDSAVEID : "222222222222222222"                                      //ID du serveur "archive"
};

exports.db = {
        HOST : "localhost",
        USER : "USERNAME",
        PSWD : "PASSWORD",
        DDB  : "UserDB"
};

exports.prefix = "?";                                                       //Prefixe de commande du bot
```
Installer avec
`npm install`

Executer avec
`node  CyrkBot.js` ou `npm run start`
