const _local = require('./local.js');
const {Client, Intents, MessageEmbed} = require('discord.js');
const discordjs = require("discord.js");
const util = require('util')

console.log(discordjs.version)

let GLOBAL = {}
GLOBAL.local = _local;
GLOBAL.guilds = {}
GLOBAL.guildsRoulette = {}

let {channelTree} = require("./channelTree.js")
let {messageDelete} = require("./messageDelete.js")
let {messageSend} = require("./messageSend.js")
let {archiveChannel, fetchFirstMessageChannel} = require("./archiveChannel.js")
let {archiveMsgCreate, archiveMsgDelete, archiveMsgUpdate} = require("./archiveChannel.js")

let archivedChannel = [
	""
	,""
]

GLOBAL.bot = new Client({intents : [
	Intents.FLAGS.GUILDS, 
	Intents.FLAGS.GUILD_MEMBERS,
	Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
	Intents.FLAGS.DIRECT_MESSAGES,
	Intents.FLAGS.DIRECT_MESSAGE_REACTIONS  
],  partials: ["CHANNEL"]});


var mysql = require('mysql');
GLOBAL.con = mysql.createConnection({
	host: GLOBAL.local.db.HOST,
	user: GLOBAL.local.db.USER,
	password: GLOBAL.local.db.PSWD,
	database: GLOBAL.local.db.DDB,
	charset : 'utf8mb4_bin'
});
try{
	GLOBAL.con.connect(function(err) {
		if (err) throw err;
		console.log("Connected to database");
		
		GLOBAL.con.query("SELECT * FROM `SaveBotServers` WHERE `active` = 1", (err, res, fields) => {
			if (err)
				throw (err);
			else {
				res.forEach(srv => {
					console.log(srv);
					GLOBAL.guilds[srv["originId"]] = srv["destId"];
					GLOBAL.guildsRoulette[srv["originId"]] = srv["roulette"];
					console.log(Object.keys(GLOBAL.guilds).length, res.length)
					console.log(srv)
					if (Object.keys(GLOBAL.guilds).length == res.length)
						GLOBAL.bot.login(GLOBAL.local.bot.TOKEN)
				})
			}
		})
	});
}
catch(err){
	console.log.error('Database connexion failed.')
	return 0;
}


GLOBAL.bot.on('ready', () => {
	console.log("Bot connecté");
	Object.keys(GLOBAL.guilds).forEach(GuildId => {
		console.log(GuildId)
		GLOBAL.bot.guilds.fetch(GuildId)
		.then(_guild => {
			GLOBAL.guild = _guild;
			try {
				_guild.members.fetch("292808250779369482")
				.then(_cyrk => {
					_guild.members.fetch(GLOBAL.bot.user.id)
					.then(_bot => {
						_bot.setNickname(_cyrk.nickname);
					})
				})
			}catch (err) {
				console.log("ERROR while fetching / renaming Cyrk or bot")
				console.log(err)
			}
			
			// if (GuildId === "767688244010680330") {
				// console.log("CHANEL TREE")
				// channelTree(GLOBAL, _guild).then(arr => {
					// console.log("Tree done")
					// console.log(arr)
					// console.log(typeof(arr))
					// Object.keys(arr).forEach(cat => {
						// arr[cat].subChan.forEach(chan => {
							// if (chan.type == 'GUILD_TEXT')
								// console.log(chan.id + " - " + chan.name)
						// })
					// })
					// console.log(util.inspect(arr, {showHidden: false, depth: null, colors: true}))
				// })
			// }
			
			
			// _guild.fetchAuditLogs()
			// .then(audit => {
				// audit.entries.forEach(entry => {
					// if (entry.action == 'MEMBER_ROLE_UPDATE' && entry.target.id == GLOBAL.local.bot.BOTID)
						// console.log(entry);
				// })
			// })
			// .catch(console.error);
			
			
		}).catch(err => {
			console.log("Can't get server.")
			console.log(err);
		});
		
		// functions.init(GLOBAL);
		// GLOBAL.bot.user.setActivity({
			// name: "you",
			// type: "WATCHING"
		// })
	})
	
	// GLOBAL.bot.guilds.fetch("922498118631714867")
	// .then(guild => {
		// console.log("Guild fetched")
		// guild.roles.fetch("922499018704166933").then(cyrkRole => {
			// guild.roles.fetch("950736804938670161").then(tronc2Role => {
				// console.log("Cyrk role pos: " + cyrkRole.rawPosition)
				// console.log("Tronc role pos: " + tronc2Role.rawPosition)
				// guild.roles.setPositions([{role:tronc2Role.id, position:cyrkRole.rawPosition}, {role:cyrkRole.id, position:tronc2Role.rawPosition}]).then(_guild => {
					// _guild.roles.fetch("922499018704166933").then(_cyrkRole => {
						// _guild.roles.fetch("950736804938670161").then(_tronc2Role => {
							// console.log("Cyrk role pos: " + _cyrkRole.rawPosition)
							// console.log("Tronc role pos: " + _tronc2Role.rawPosition)
						// })
					// })
				// })
			// })
		// })
	// });
})

.on('raw', data => {
	if(data.t && data.t == 'MESSAGE_DELETE') {
		archiveMsgDelete(GLOBAL, data.d.id);
	}
	else if(data.t && data.t == 'MESSAGE_UPDATE' && typeof(data.d.author) != "undefined" && data.d.author.id != GLOBAL.local.bot.BOTID) {
		archiveMsgUpdate(GLOBAL, data.d.id);
	}
})
.on('messageCreate', (message) =>{
	
	// if (message.guildId === GLOBAL.local.bot.GUILDID || message.channelId === "908064471560380466") {
	if(Object.keys(GLOBAL.guilds).indexOf(message.guildId) > -1) {
		archiveMsgCreate(GLOBAL, message)
	}
	
	// if (message.guildId === GLOBAL.local.bot.GUILDSAVEID && message.author.id != GLOBAL.local.bot.BOTID) {
	if(Object.values(GLOBAL.guilds).indexOf(message.guildId) > -1 && message.author.id != GLOBAL.local.bot.BOTID) {
		GLOBAL.con.query("SELECT * FROM `SaveBotChannels` WHERE `destId`="+ GLOBAL.con.escape(message.channelId) +";", (err, res, fields) => {
			if (err) {
				console.log(err)
			}
			else if (typeof(res[0]) == "undefined"){
				console.log("Channel not in DB")
			}
			else {
				GLOBAL.bot.channels.fetch(res[0].originId).then(chan => {
					new Promise((resolve, reject) => {
						if (message.reference == null) {
							resolve(null)
						}
						else {
							GLOBAL.con.query("SELECT * FROM `SaveBotMessages` WHERE `saveId`="+ GLOBAL.con.escape(message.reference.messageId) +";", (err, res2) => {
								if (err) {
									console.log("Error while getting data on DB")
									reject(err)
								}
								if (typeof(res2[0]) == "undefined") {
									resolve(null)
								}
								else {
									resolve(res2[0].messageId)
								}
							})
						}
					}).then(replyId => {
						let messageOptions = {
							content : message.content
						}
						
						if (replyId) {
							messageOptions.reply = {
								messageReference : replyId,
								failIfNotExists : false
							}
						}
						console.log("MESSAGE OPTIONS")
						console.log(messageOptions)
						chan.send(messageOptions).then(msg => {
							message.react('👍')
						});
					}).catch(e => {
						console.log("Error while getting replyOptions")
						console.log(e)
						message.reply("Error while getting replyOptions");
					})
				})
			}
		})
	}
	
	if (message.content.startsWith("???ping")) {
		message.author.send("Emergency pong!");
	}
	else if (message.author.id != GLOBAL.local.bot.BOTID) {
		const args = message.content.trim().split(/ +/g);
		const command = args.shift().toLowerCase().slice(GLOBAL.local.prefix.length);
		
		switch (command) {
			case 'ping': {
				console.log("getting pinged")
				message.reply("Pong !");
				break;
			}
			case 'reload': {
				if (message.author.id == "292808250779369482")
				{
					message.reply("Restarting Bot").then(_ => {
						process.exit();
					})
				}
				break;
			}
			case 'timeout': {
				if (message.author.id == "292808250779369482")
				{
					message.member.timeout(3000);
				}
				break;
			}
			case 'delete': {
				if (message.author.id == "292808250779369482") {
					messageDelete(GLOBAL, message)
					.then(res => {
						console.log(res)
					})
					.catch(console.log)
				}
				break;
			}
			case 'say' :
			case 'send' : {
				if (message.author.id == "292808250779369482") {
					let messageTrim = message.content.substring((GLOBAL.local.prefix + command + ' ').length);
					message.delete();
					messageSend(GLOBAL, message, message.channelId, messageTrim)
					.then(res => {
						console.log(res);
					})
					.catch(e => {
						console.log(e);
						// message.reply("Error")
					})
				}
				break;
			}
			case 'ssay' :
			case 'ssend' : {
				if (message.author.id == "292808250779369482") {
					let channelID = args[0];
					let messageTrim = message.content.substring((GLOBAL.local.prefix + command + ' ' + args[0] + " ").length);
					
					messageSend(GLOBAL, message, channelID, messageTrim)
					.then(res => {
						console.log(res);
						if (message.channelId != channelID)
							message.reply("Message sent in `"+ channelID +"`:\n>>> "+ messageTrim)
						else
							message.delete();
					})
					.catch(e => {
						console.log(e);
						// message.reply("Error")
					})
				}
				break;
			}
			case 'react': {
				GLOBAL.bot.channels.fetch(args[0]).then(chan => {
					chan.messages.fetch(args[1]).then(msg => {
						msg.react(args[2])
						console.log("React success");
					}).catch(console.log)
				}).catch(console.log)
				break;
			}
			case 'messageinfo': {
				GLOBAL.bot.channels.fetch(args[0]).then(chan => {
					chan.messages.fetch(args[1]).then(msg => {
						console.log(msg);
					}).catch(console.log)
				}).catch(console.log)
				break;
			}
			case 'channelinfo': {
				GLOBAL.bot.channels.fetch(args[0]).then(chan => {
					console.log(chan);
				}).catch(console.log)
				break;
			}
			case 'guildinfo': {
				GLOBAL.bot.guilds.fetch(args[0]).then(guild => {
					console.log(guild);
				}).catch(console.log)
				break;
			}
			case 'userinfo': {
				GLOBAL.bot.users.fetch(args[0]).then(usr => {
					console.log(usr)
				}).catch(console.log)
				break;
			}
			case 'firstmessage': {
				if (message.author.id == "292808250779369482") {
					fetchFirstMessageChannel(GLOBAL, args[0])
					.then(msg => {
						if (msg == null) {
							message.reply("Pas de premier message ou erreur")
						}
						else {
							console.log(msg.id)
							message.reply("https://discord.com/channels/"+ msg.guildId +"/"+ msg.channelId +"/"+ msg.id)
						}
					})
					.catch(e => {
						console.log(e);
					});
				}
				break;
			}
			case 'messagereaction': {
				GLOBAL.bot.channels.fetch(args[0]).then(chan => {
					chan.messages.fetch(args[1], {'cache': false, 'force': true}).then(msg => {
						react = msg.reactions.resolve(args[2]);
						if (react == null)
							message.reply('0 !');
						else {
							if (react.me)
								message.reply((react.count-1) + ' ! (i didn t counted mine)')
							else
								message.reply(react.count + ' !');
						}
					}).catch(console.log)
				}).catch(console.log)
				break;
			}
			case 'poll': {
				message.react("👍").then(_ => {
					message.react("👎").then(_ => {
						
						let rePatern = /.?poll.+(set(\d+))/
						let re = new RegExp(rePatern);
						
						console.log(message.content)
						
						let timer = 3000
						if (message.content.match(rePatern)) {
							match = re.exec(message.content)
							
							// console.log(match)
							// console.log("------")
							// console.log(match[0])
							// console.log("------")
							// console.log(match[1])
							// console.log("------")
							// console.log(match[2])
							// console.log("------")
							
							timer = parseInt(match[2])*1000
						}
						
						setTimeout(() => { 
							reactUp = message.reactions.resolve("👍")
							reactDw = message.reactions.resolve("👎")
							
							if (reactUp == null)
								message.reply('0 pour bleu')
							else {
								if (reactUp.me)
									message.reply((reactUp.count - 1) + ' pouce bleu (je me compte pas)')
								else
									message.reply(reactUp.count + ' pouce bleu')
							}
							if (reactDw == null)
								message.reply('0 pour bleu')
							else {
								if (reactDw.me)
									message.reply((reactDw.count - 1) + ' pouce rouge (je me compte pas)')
								else
									message.reply(reactDw.count + ' pouce rouge')
							}
						}, timer)
					})
				})
				break;
			}
			case 'archive' : {
				if (message.author.id == "292808250779369482") {
					let boucle = (iterateur) => {
						archiveChannel(GLOBAL, args[iterateur])
						.then(_ => {
							console.log("Archive over")
							if (iterateur < args.length -1)
								boucle(iterateur+1)
						}).catch(e => {
							console.log("Archive failure")
							console.log(e)
							if (iterateur < args.length-1)
								boucle(iterateur+1)
						})
					}
					boucle(0);
				}
				break;
			}
			
			case 'roulette': {
				if (message.guildId == "1013893623902900366" || message.guildId == "1044728540895125504") {
					
					let guildId = message.guildId;
					if (Object.values(GLOBAL.guilds).indexOf(message.guildId) > -1)
						guildId = Object.keys(GLOBAL.guilds)[Object.values(GLOBAL.guilds).indexOf(message.guildId)]
					console.log("Roulette count: " + GLOBAL.guildsRoulette[guildId]);
					if (GLOBAL.guildsRoulette[guildId] == 0) {
						GLOBAL.guildsRoulette[guildId] = Math.floor(Math.random() * 6);
						
						GLOBAL.con.query("UPDATE `SaveBotServers` SET `roulette`= "+ GLOBAL.guildsRoulette[guildId] +" \
						  WHERE `originId` = '"+ guildId +"';", 
						(err, res, fields) => {
							if (err)
								throw (err);
						})
						message.reply("**BANG !**");
                        
                        let timeoutDuration = Math.floor(Math.random() * 270) + 30
						message.member.timeout(timeoutDuration * 1000);
					}
					else {
						GLOBAL.guildsRoulette[guildId] -= 1;
						GLOBAL.con.query("UPDATE `SaveBotServers` SET `roulette`= `roulette`-1 \
						  WHERE `originId` = '"+ guildId +"';", 
						(err, res, fields) => {
							if (err)
								throw (err);
						})
						message.reply("click")
					}
					
					console.log(GLOBAL.guildsRoulette)
				}
			}
		}
	}
})