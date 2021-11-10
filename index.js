const _local = require('./local.js');
const {Client, Intents, MessageEmbed} = require('discord.js');
const util = require('util')

let GLOBAL = {}
GLOBAL.local = _local;

let {channelTree} = require("./channelTree.js")
let {messageDelete} = require("./messageDelete.js")
let {messageSend} = require("./messageSend.js")

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
		let localLog = (e) => {
			console.log(e)
		}
		
		GLOBAL.con.query("SELECT * FROM `SaveBotMessages` AS M JOIN `SaveBotChannels` AS C ON C.`originId` = M.`channelId` WHERE `messageId` = " + GLOBAL.con.escape(data.d.id) +";", 
		(err, res, fields) => {
			if (err) {
				console.log(err)
			}
			else if (typeof(res[0]) != "undefined") {
				res = res[0];
				GLOBAL.bot.channels.fetch(res.destId).then(chan => {
					chan.messages.fetch(res.saveId).then(msg => {
						
						new Promise( (resolve) => {
							let i = 0;
							let embedArray = []
							msg.embeds.forEach(emb => {
								i++;
								embedArray.push(emb);
								if (i == msg.embeds.length) {
									resolve(embedArray)
								}
							})
						})
						.then(embedArray => {
							let embed = embedArray[embedArray.length - 1]
							
							let mtn = new Date();
							
							if (embed.fields.length == 24 || embed.fields.length == 0) {
								embed = new MessageEmbed()
								.setTimestamp(Date.now())
								.setDescription("Embed n°" + embedArray.length)
								.setFooter("last change")
								embedArray.push(embed);
							}
							embed.setTimestamp(Date.now())
								.setFooter("last change")
								.setColor([255, 100, 100])
								.addField("Supprimé à`"+ Date.now() +"` ("+ mtn +")", "---")
							
							msg.edit({
								embeds : embedArray
							}).catch(e => {
								console.log("Couldn't edit message")
								console.log(e)
							})
						})
					})
				})
			} else {
				console.log(res)
				console.log("Message unknown in db")
			}
		});
	}
	else if(data.t && data.t == 'MESSAGE_UPDATE' && typeof(data.d.author) != "undefined" && data.d.author.id != GLOBAL.local.bot.BOTID) {
		
		let localLog = (e) => {
			console.log(e)
		}
		
		GLOBAL.con.query("SELECT * FROM `SaveBotMessages` AS M JOIN `SaveBotChannels` AS C ON C.`originId` = M.`channelId` WHERE `messageId` = " + GLOBAL.con.escape(data.d.id) +";", 
		(err, res, fields) => {
			if (err) {
				console.log(err)
			}
			else if (typeof(res[0]) != "undefined") {
				res = res[0];
				GLOBAL.bot.channels.fetch(res.destId).then(chan => {
					GLOBAL.bot.channels.fetch(res.originId).then(chanOrigin => {
						chan.messages.fetch(res.saveId).then(msg => {
							chanOrigin.messages.fetch(res.messageId).then(msgOrigin => {
								
								if(msgOrigin.author.bot) {
									msg.edit({
										content: "`BOT: "+ msgOrigin.author.username +" (updated on "+ new Date() +"`\n" + msgOrigin.content,
										embeds : msgOrigin.embeds,
										// attachments : msg.attachments,
										stickers : msgOrigin.stickers,
										files : msgOrigin.attachments
									})
								}
								else {
									new Promise( (resolve) => {
										let i = 0;
										let embedArray = []
										msg.embeds.forEach(emb => {
											i++;
											embedArray.push(emb);
											if (i == msg.embeds.length) {
												resolve(embedArray)
											}
										})
									})
									.then(embedArray => {
										let embed = embedArray[embedArray.length - 1]
										
										let mtn = new Date();
										
										if (embed.fields.length >= 23) {
											embed = new MessageEmbed()
											.setTimestamp(Date.now())
											.setDescription("Embed n°" + embedArray.length)
											.setFooter("last change")
											embedArray.push(embed);
										}
										embed.setTimestamp(Date.now())
											.setFooter("last change")
											.setColor([100, 100, 255])
											.addField("Edité à `"+ Date.now() +"` ("+ mtn +")", msgOrigin.content ? msgOrigin.content.substr(0, 1023) : "no content")
										
										if (msgOrigin.content.length > 1023)
											embed.addField("Suite message:", msgOrigin.content.substr(1024))
										
										msg.edit({
											embeds : embedArray
										}).catch(e => {
											console.log("Couldn't edit message")
											console.log(e)
										})
									})
								}
							})
						})
					})
				})
			} else {
				console.log(res)
				console.log("Message unknown in db")
			}
		});
	}
})
.on('messageCreate', (message) =>{
	
	if (message.guildId === GLOBAL.local.bot.GUILDID) {
		getArchiveChannelId(GLOBAL, message.channelId)
		.then(channelId => {
			GLOBAL.bot.channels.fetch(channelId).then(chanArchive => {
				archiveMessage(GLOBAL, message, chanArchive).catch(console.log)
			})
			.catch(e => {
				console.log("Error while fetching channel for log: ")
				console.log(e)
			})
		}).catch(e => {
			console.log(e)
		})
		
		/*
		GLOBAL.con.query("SELECT * FROM `SaveBotChannels` WHERE `originId` = " + GLOBAL.con.escape(message.channelId) +";", 
		(err, res, fields) => {
			if (err) {
				console.log(err)
				return;
			}
			if (typeof(res[0]) != "undefined")
			{
				localLog("Channel trouve")
				archiveMessage(message, res[0].destId);
			}
			else {
				localLog("Le channel n'existe pas")
				GLOBAL.bot.channels.fetch(message.channelId).then(channel => {
					localLog("On fetch le channel d'origine")
					GLOBAL.bot.guilds.fetch(GLOBAL.local.bot.GUILDSAVEID).then(guildSave => {
						localLog("On fetch la guild de save")
						new Promise((resolve) => {
							if (channel.parentId == null) {
								localLog("Pas de parent")
								resolve(null)
							}
							else {
								GLOBAL.con.query("SELECT * FROM `SaveBotChannels` WHERE `originId` = " + GLOBAL.con.escape(channel.parentId) +";", 
								(err, res, fields) => {
									if (err)
										console.log(err)
									else if (typeof(res[0]) == "undefined") {
										localLog("Parent pas dans la BDD")
										GLOBAL.bot.channels.fetch(channel.parentId).then(channelParentOrigin => {
											localLog("On fetch le parent")
											guildSave.channels.create(channelParentOrigin.name, {
												type : channelParentOrigin.type, 
												position : channelParentOrigin.rawPosition, 
												topic: channelParentOrigin.topic
											})
											.then(chanParentDest => {
												localLog("On creer le parent")
												GLOBAL.con.query("INSERT INTO `SaveBotChannels`(`originId`, `destId`) VALUES ("+ GLOBAL.con.escape(channelParentOrigin.id) +", "+  GLOBAL.con.escape(chanParentDest.id) +")", (err) => {
													localLog("On insert le parent dans la BDD")
													if (err)
														console.log(err)
													else
														resolve(chanParentDest.id)
												})
											})
										})
									}
									else {
										localLog("Parent EST dans la bdd, on resolve")
										resolve(res[0].destId)
									}
								});
							}
						})
						.then(chanParentDestId => {
							guildSave.channels.create(channel.name, {
								type : channel.type,
								topic : channel.topic,
								parent : chanParentDestId,
								position : channel.rawPosition
							}).then(chan => {
								
								GLOBAL.con.query("INSERT INTO `SaveBotChannels`(`originId`, `destId`) VALUES ("+ GLOBAL.con.escape(channel.id) +", "+  GLOBAL.con.escape(chan.id) +")", (err) => {
									if (err)
										console.log(err)
									else {
										archiveMessage(message, chan.id);
									}
								})
							})
						});
					})
				})
			}
		})
		*/
	}
	
	if (message.content.startsWith("???ping")) {
		message.author.send("Emergency pong!");
	}
	else if (message.author.id != GLOBAL.local.bot.BOTID) {
		const args = message.content.trim().split(/ +/g);
		const command = args.shift().toLowerCase().slice(GLOBAL.local.prefix.length);;
		
		console.log(command);
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
						// message.delete().catch(e => {
							// print("Couldn't delete ordering message")
						// });
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
			case 'firstmessage': {
				if (message.author.id == "292808250779369482") {
					fetchFirstMessageChannel(args[0])
					.then(msg => {
						console.log(msg.id)
					})
					.catch(e => {
						console.log(e);
					});
				}
				break;
			}
			
			case 'archive' : {
				let limit = 20;
				let archiveFrom = (messageId, chanSrc, chanArchive) => {
					chanSrc.messages.fetch({
						limit : limit,
						after : messageId
					}).then(msgs => {
						return new Promise((resolve, reject) => {
							let iterate = (id) => {
								archiveMessage(GLOBAL, msgs.at(id), chanArchive)
								.then(_ => {
									if (id == 1)
										resolve();
									else 
										iterate(id-1);
								}).catch(e => {
									console.log("Error while archiving message " + msgs.at(id).id)
									console.log(e)
								})
							}
							iterate(msgs.size - 1);
						}).then(_ => {
							if (msgs.size == limit)
								archiveFrom(msgs.at(1).id, chanSrc, chanArchive)
							else {
								archiveMessage(GLOBAL, msgs.at(0), chanArchive)
							}
						})
					})
				}
				
				if (message.author.id == "292808250779369482") {
					GLOBAL.bot.channels.fetch(args[0]).then(chanSrc => {
						console.log("ChanSrc fetch")
						getArchiveChannelId(GLOBAL, args[0]).then(chanArchiveId => {
							console.log("Archive channel ID: " + chanArchiveId)
							GLOBAL.bot.channels.fetch(chanArchiveId).then(chanArchive => {
								console.log("Archive channel fetch")
								GLOBAL.con.query("SELECT * FROM `SaveBotChannels` WHERE `originId` = "+ GLOBAL.con.escape(chanSrc.id) +";", (err, res, fields) => {
									if (err)
										console.log(err)
									else {
										
										console.log("DB query executee")
										
										if (typeof(res[0]) == "undefined") {
											console.log("ERREUR : channel not found in DB")
										}
										else if (res[0].lastRegisteredMessageId == 0) {
											fetchFirstMessageChannel(GLOBAL, chanSrc.id).then(msg => {
												archiveMessage(GLOBAL, msg, chanArchive)
												.then(_ => {
													archiveFrom(msg.id, chanSrc, chanArchive)
												}).catch(console.log)
											})
										}
										else {
											archiveFrom(res[0].lastRegisteredMessageId, chanSrc, chanArchive)
										}
									}
								})
							})
						}).catch(e => {
							console.log("ERror while searching for archive channel")
							console.log(e)
						})
					})
				}
				break;
			}
			
			
		}
	}
})

let archiveMessage = (GLOBAL, msg, chanArchive) => {
	let localLog = (e) => {
		//console.log(e)
	}
	
	return new Promise( (resolve, reject) => {
		if(msg.author.bot) {
			chanArchive.send({
				content: "`BOT: "+ msg.author.username +"`\n" + msg.content,
				embeds : msg.embeds,
				// attachments : msg.attachments,
				stickers : msg.stickers,
				files : msg.attachments
			})
			.then(msgSent => {
				localLog("Message envoye")
				GLOBAL.con.query("INSERT INTO `SaveBotMessages`(`messageId`, `channelId`, `saveId`) VALUES ("+ GLOBAL.con.escape(msg.id) +", "+  GLOBAL.con.escape(msg.channelId) +", "+  GLOBAL.con.escape(msgSent.id) +")", (err) => {
					if (err)
						reject(err)
					else
						resolve("Success")
				})
			}).catch(reject)
		}
		else {
			new Promise((resolve, reject) => {
				GLOBAL.guild.members.fetch(msg.author.id).then(member => {
					resolve(member);
				}).catch(e => {
					resolve(null)
				})
			}).then(member => {
				let mtn = new Date();
				let embed = new MessageEmbed()
					.setAuthor((member && member.nickname ? member.nickname + '(' + member.user.username + ')' : msg.author.username), "https://cdn.discordapp.com/avatars/"+ msg.author.id +"/"+ msg.author.avatar, "https://discord.com/channels/"+ msg.guildId +"/"+ msg.channelId +"/"+ msg.id)
					.setFooter("last change")
					.setTimestamp(msg.createdTimestamp)
					.setDescription("Embed n°0 - Message ID: `"+ msg.id +"`")
					.setColor([100, 255, 100])
					.addField("Posté à `"+ msg.createdTimestamp +"` ("+ mtn + ")", msg.content? msg.content.substr(0, 1023) : "no content")
				
				if (msg.content.length > 1023)
					embed.addField("Suite message:", msg.content.substr(1024))
					
				if (msg.deleted)
					embed.setColor([255, 100, 100])
				else if (msg.editedAt != null)
					embed.setColor([100, 100, 255])
				
				chanArchive.send({
					embeds : [embed],
					// attachments : msg.attachments,
					stickers : msg.stickers,
					files : msg.attachments
				})
				.then(msgSent => {
					localLog("Message envoye")
					GLOBAL.con.query("UPDATE `SaveBotChannels` SET `lastRegisteredMessageId`="+ GLOBAL.con.escape(msg.id) +" WHERE `originId`="+ msg.channelId +";", (err) => {
						if (err){
							console.log("ERROR: can't lastRegisteredMessageId in DB")
							reject(err)
						}
						else {
							GLOBAL.con.query("INSERT INTO `SaveBotMessages`(`messageId`, `channelId`, `saveId`) VALUES ("+ GLOBAL.con.escape(msg.id) +", "+  GLOBAL.con.escape(msg.channelId) +", "+  GLOBAL.con.escape(msgSent.id) +")", (err) => {
								if (err){
									console.log("ERROR: can't insert new message into SaveBotChannels")
									reject(err)
								}
								else
									resolve("Success");
							})
						}
					})
				}).catch(reject)
			}).catch(reject)
		}
	})
}

let getArchiveChannelId = (GLOBAL, channelId) => {
	let localLog = (e) => {
		//console.log(e)
	}
	
	return new Promise((resolve1, reject1) => {
		GLOBAL.con.query("SELECT * FROM `SaveBotChannels` WHERE `originId` = " + GLOBAL.con.escape(channelId) +";", 
		(err, res, fields) => {
			if (err) {
				reject1(err)
				return;
			}
			if (typeof(res[0]) != "undefined")
			{
				localLog("Channel trouve")
				// archiveMessage(message, res[0].destId);
				resolve1(res[0].destId)
			}
			else {
				localLog("Le channel n'existe pas")
				GLOBAL.bot.channels.fetch(channelId).then(channel => {
					localLog("On fetch le channel d'origine")
					GLOBAL.bot.guilds.fetch(GLOBAL.local.bot.GUILDSAVEID).then(guildSave => {
						localLog("On fetch la guild de save")
						new Promise((resolve, reject) => {
							if (channel.parentId == null) {
								localLog("Pas de parent")
								resolve(null)
							}
							else {
								GLOBAL.con.query("SELECT * FROM `SaveBotChannels` WHERE `originId` = " + GLOBAL.con.escape(channel.parentId) +";", 
								(err, res2, fields) => {
									if (err) {
										console.log("Error while searching for parent channel")
										reject(err)
									}
									else if (typeof(res2[0]) == "undefined") {
										localLog("Parent pas dans la BDD")
										GLOBAL.bot.channels.fetch(channel.parentId).then(channelParentOrigin => {
											localLog("On fetch le parent")
											guildSave.channels.create(channelParentOrigin.name, {
												type : channelParentOrigin.type, 
												position : channelParentOrigin.rawPosition, 
												topic: channelParentOrigin.topic
											})
											.then(chanParentDest => {
												localLog("On creer le parent")
												GLOBAL.con.query("INSERT INTO `SaveBotChannels`(`originId`, `destId`) VALUES ("+ GLOBAL.con.escape(channelParentOrigin.id) +", "+  GLOBAL.con.escape(chanParentDest.id) +")", (err) => {
													localLog("On insert le parent dans la BDD")
													if (err) {
														console.log("Error while inserting parent channel in DB")
														reject(err)
													}
													else
														resolve(chanParentDest.id)
												})
											}).catch(e => {
												console.log("Error while creating archive parent channel")
												reject(e)
											})
										}).catch(e => {
											console.log("Error while fetching original parent channel")
											reject(e)
										})
									}
									else {
										localLog("Parent EST dans la bdd, on resolve")
										resolve(res2[0].destId)
									}
								});
							}
						})
						.then(chanParentDestId => {
							guildSave.channels.create(channel.name, {
								type : channel.type,
								topic : channel.topic,
								parent : chanParentDestId,
								position : channel.rawPosition
							}).then(chan => {
								GLOBAL.con.query("INSERT INTO `SaveBotChannels`(`originId`, `destId`) VALUES ("+ GLOBAL.con.escape(channel.id) +", "+  GLOBAL.con.escape(chan.id) +")", (err) => {
									if (err) {
										console.log("Error while inserting channel in savebotchannels")
										reject1(err)
									}
									else {
										resolve1(chan.id)
									}
								})
							}).catch(e => {
								console.log("Can't create channel")
								reject1(e)
							})
						}).catch(e => {
							reject1(e)
						});
					}).catch(e => {
						reject1(e)
					})
				}).catch(e => {
					console.log("Can't fetch guild save: " + GLOBAL.local.bot.GUILDSAVEID)
					reject1(e)
				})
			}
		})
	})
}

let fetchFirstMessageChannel = (GLOBAL, channelId) => {
	return new Promise((resolve1, reject1) => {
		GLOBAL.bot.channels.fetch(channelId).then(chan => {
			let limit = 100;
			let fetchFirstMessage = (beforeMessageID) => {
				chan.messages.fetch({
					limit : limit,
					before : beforeMessageID
				}).then(msgs => {
					new Promise(resolve => {
						i = 0;
						firstMessage = msgs.first();
						msgs.forEach(msg => {
							i++;
							if (msg.createdTimestamp < firstMessage.createdTimestamp)
								firstMessage = msg;
							
							if (i === msgs.size)
								resolve(firstMessage)
						})
					})
					.then(firstMessage => {
						// console.log(msgs.size + " - " + limit)
						if (msgs.size != limit) {
							resolve1(firstMessage)
							// console.log(firstMessage);
							// console.log("https://discord.com/channels/"+ firstMessage.guildId +"/"+ firstMessage.channelId +"/"+ firstMessage.id)
						}
						else {
							fetchFirstMessage(firstMessage.id)
						}
					})
				})
				.catch(e => {
					reject1(e);
				})
			}
			fetchFirstMessage(chan.lastMessageId);
		})
	})
}
