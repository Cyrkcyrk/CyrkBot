const _local = require('./local.js');
const {Client, Intents, MessageEmbed} = require('discord.js');
const util = require('util')

let GLOBAL = {}
GLOBAL.local = _local;

let {channelTree} = require("./channelTree.js")
let {messageDelete} = require("./messageDelete.js")
let {messageSend} = require("./messageSend.js")
let {archiveChannel, archiveMessage, getArchiveChannelId, fetchFirstMessageChannel, archiveMsgCreate, archiveMsgDelete, archiveMsgUpdate} = require("./archiveChannel.js")

let archivedChannel = [
	""
	,""
]

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
		return 1;
	});
}
catch(err){
	console.log.error('Database connexion failed.')
	return 0;
}

GLOBAL.bot = new Client({intents : [
	Intents.FLAGS.GUILDS, 
	Intents.FLAGS.GUILD_MEMBERS,
	Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
	Intents.FLAGS.DIRECT_MESSAGES,
	Intents.FLAGS.DIRECT_MESSAGE_REACTIONS  
],  partials: ["CHANNEL"]});

GLOBAL.bot.login(GLOBAL.local.bot.TOKEN)

GLOBAL.bot.on('ready', () => {
	console.log("Bot connecté");
	
	GLOBAL.bot.guilds.fetch(GLOBAL.local.bot.GUILDID)
	.then(_guild => {
		GLOBAL.guild = _guild;
		
		_guild.members.fetch("292808250779369482")
		.then(_cyrk => {
			_guild.members.fetch(GLOBAL.bot.user.id)
			.then(_bot => {
				_bot.setNickname(_cyrk.nickname);
			})
		})
		
		// channelTree(GLOBAL, _guild).then(arr => {
			// console.log("Tree done")
			// console.log(typeof(arr))
			// Object.keys(arr).forEach(cat => {
				// arr[cat].subChan.forEach(chan => {
					// if (chan.type == 'GUILD_TEXT')
						// console.log(chan.id)
				// })
			// })
			// console.log(util.inspect(arr, {showHidden: false, depth: null, colors: true}))
		// })
		
		
		// _guild.fetchAuditLogs()
		// .then(audit => {
			// audit.entries.forEach(entry => {
				// if (entry.action == 'MEMBER_ROLE_UPDATE' && entry.target.id == GLOBAL.local.bot.BOTID)
					// console.log(entry);
			// })
		// })
		// .catch(console.error);
		
		
	});
	
	// functions.init(GLOBAL);
	// GLOBAL.bot.user.setActivity({
		// name: "you",
		// type: "WATCHING"
	// })
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
	
	if (message.guildId === GLOBAL.local.bot.GUILDID || message.channelId === "908064471560380466") {
		archiveMsgCreate(GLOBAL, message)
	}
	
	if (message.guildId === GLOBAL.local.bot.GUILDSAVEID && message.author.id != GLOBAL.local.bot.BOTID) {
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
		const command = args.shift().toLowerCase().slice(GLOBAL.local.prefix.length);;
		
		switch (command) {
			case 'ping': {
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
			case 'archive' : {
				if (message.author.id == "292808250779369482") {
					let boucle = (iterateur) => {
						// console.log(iterateur, args[iterateur])
						archiveChannel(GLOBAL, args[iterateur])
						.then(_ => {
							console.log("Archive over")
							if (iterateur < args.length)
								boucle(iterateur+1)
						}).catch(e => {
							console.log("Archive failure")
							console.log(e)
							if (iterateur < args.length)
								boucle(iterateur+1)
						})
					}
					boucle(0);
				}
				break;
			}
		}
	}
})