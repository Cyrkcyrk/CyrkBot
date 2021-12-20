const {MessageEmbed} = require('discord.js');

let archiveChannel = (GLOBAL, paramChanID) => {
	let localLog = (m) => {
		console.log(m)
	}
	
	let limit = 90;
	let archiveFrom = (messageId, chanSrc, chanArchive) => {
		return new Promise((resolve1, reject1) => {
			chanSrc.messages.fetch({
				limit : limit,
				after : messageId
			}).then(msgs => {
				return new Promise((resolve, reject) => {
					let iterate = (id) => {
						localLog(id);
						archiveMessage(GLOBAL, msgs.at(id), chanArchive)
						.then(_ => {
							if (id == 1)
								resolve();
							else 
								iterate(id-1);
						}).catch(e => {
							console.log("Error while archiving message ")
							console.log("iterateur " + id)
							if (id >= 0 && id < msgs.size)
								console.log("MsgId " + msgs.at(id).id)
							console.log(e)
							reject(e)
						})
					}
					if (msgs.size == 0) {
						localLog("No message in channel")
						resolve()
					}
					else if (msgs.size == 1) {
						localLog("Only 1 message fetched")
						resolve();
					}
					else
						iterate(msgs.size - 1);
				}).then(_ => {
					if (msgs.size == limit) {
						archiveFrom(msgs.at(1).id, chanSrc, chanArchive)
						.then(resolve1).catch(reject1)
					}
					else if (msgs.size != 0) {
						archiveMessage(GLOBAL, msgs.at(0), chanArchive)
						.then(resolve1).catch(reject1)
					}
					else
						resolve1();
				}).catch(reject1)
			})
		})
	}
	
	
	return new Promise( (resolve, reject) => {
		GLOBAL.bot.channels.fetch(paramChanID).then(chanSrc => {
			localLog("ChanSrc fetch")
			getArchiveChannelId(GLOBAL, paramChanID).then(chanArchiveId => {
				localLog("Archive channel ID: " + chanArchiveId)
				GLOBAL.bot.channels.fetch(chanArchiveId).then(chanArchive => {
					localLog("Archive channel fetch")
					GLOBAL.con.query("SELECT * FROM `SaveBotChannels` WHERE `originId` = "+ GLOBAL.con.escape(chanSrc.id) +";", (err, res, fields) => {
						if (err){
							console.log("Error while getting Channels infos from DB")
							reject(e)
						}
						else {
							localLog("DB query executee")
							if (typeof(res[0]) == "undefined") {
								console.log("ERREUR : channel not found in DB")
								reject("channel not found in DB")
							}
							else if (res[0].lastRegisteredMessageId == 0) {
								localLog("Fetching first message")
								fetchFirstMessageChannel(GLOBAL, chanSrc.id).then(msg => {
									if (msg) {
										archiveMessage(GLOBAL, msg, chanArchive)
										.then(_ => {
											archiveFrom(msg.id, chanSrc, chanArchive)
											.then(resolve).catch(e => {
												console.log("Error while archiving "+ chanSrc.name)
												resolve();
											}).catch(e => {
												console.log("Error while archiving channel")
												reject(e)
											})
										}).catch(e => {
											console.log("Can't archive first messages")
											reject(e)
										})
									}
									else{
										console.log("First message is null")
										resolve();
									}
								}).catch(e => {
									console.log("Can't fetch first message")
									reject(e)
								})
							}
							else {
								archiveFrom(res[0].lastRegisteredMessageId, chanSrc, chanArchive)
								.then(resolve).catch(e => {
									console.log("Error while archiveFrom res[0]")
									reject(e)
								})
							}
						}
					})
				})
			}).catch(e => {
				console.log("ERror while searching for archive channel")
				reject(e)
			})
		}).catch(e => {
			console.log("Can't fetch the channel `"+ paramChanID +"`")
			reject(e)
		})
	})
}

let archiveMessage = (GLOBAL, msg, chanArchive) => {
	let localLog = (e) => {
		console.log(e)
	}
	
	return new Promise( (resolve, reject) => {
		
		new Promise((resolveRep) => {
			localLog("Est ce que y'a une reply? ")
			if (msg.reference == null) {
				localLog("Pas de references")
				resolveRep(null)
			}
			else {
				GLOBAL.con.query("SELECT * FROM `SaveBotMessages` WHERE `messageId`="+ GLOBAL.con.escape(msg.reference.messageId) +";", (err, res) => {
					if (err) {
						console.log("Error while getting data on DB")
						console.log(err)
						resolveRep(null)
					}
					else if (typeof(res[0]) == "undefined") {
						localLog("Pas trouvé dans la DB")
						resolveRep(null)
					}
					else {
						localLog("Reply trouvé")
						localLog(res[0])
						resolveRep(res[0].saveId)
					}
				})
			}
		}).then(replyId => {
			if(msg.author.bot) {
				let messageOptions = {
					content: (msg.deleted ? "(deleted) " : "") + (msg.editedTimestamp ? "(edited) " : "") + "> BOT: "+ msg.author.username +", MessageId: `"+ msg.id +"`\n" + msg.content,
					embeds : msg.embeds,
					// attachments : msg.attachments,
					// stickers : msg.stickers,
					files : msg.attachments
				}
				
				if (replyId) {
					messageOptions.reply = {
						messageReference : replyId,
						failIfNotExists : false
					}
				}
				
				chanArchive.send(messageOptions)
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
						embed.addField("Suite message:", msg.content.substr(1024, 2047))
						
					if (msg.deleted)
						embed.setColor([255, 100, 100])
					else if (msg.editedAt != null)
						embed.setColor([100, 100, 255])
					
					let messageOptions = {
						embeds : [embed],
						// attachments : msg.attachments,
						// stickers : msg.stickers,
						files : msg.attachments
					}
					
					if (replyId) {
						messageOptions.reply = {
							messageReference : replyId,
							failIfNotExists : false
						}
					}
					
					console.log(replyId)
					console.log(messageOptions)
					
					chanArchive.send(messageOptions)
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
				resolve1(res[0].destId)
			}
			else {
				localLog("Le channel n'existe pas")
				GLOBAL.bot.channels.fetch(channelId).then(channel => {
					localLog("On fetch le channel d'origine")
					// GLOBAL.bot.guilds.fetch(GLOBAL.local.bot.GUILDSAVEID).then(guildSave => {
					GLOBAL.bot.guilds.fetch(GLOBAL.guilds[channel.guildId]).then(guildSave => {
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
					console.log("Can't fetch guild save: " + GLOBAL.guilds[channel.guildId] + " from the origin guild " + channel.guildId);
					reject1(e)
				})
			}
		})
	})
}

let fetchFirstMessageChannel = (GLOBAL, channelId) => {
	let localLog = (m) => {
		console.log(m)
	}
	
	return new Promise((resolve1, reject1) => {
		localLog("Fetching first message of channel: "+channelId)
		GLOBAL.bot.channels.fetch(channelId).then(chan => {
			localLog("Channel fetched: " + chan.name)
			let limit = 100;
			let fetchFirstMessage = (beforeMessageID) => {
				localLog("Fetching messages before " + beforeMessageID)
				chan.messages.fetch({
					limit : limit,
					before : beforeMessageID
				}).then(msgs => {
					localLog("Messages fetched: " + msgs.size)
					new Promise(resolve => {
						if (msgs.size == 0) {
							localLog("Recieved message was the first one")
							chan.messages.fetch(beforeMessageID).then(msg => {
								resolve(msg)
							}).catch(e => {
								console.log("Error while fetching first message")
								console.log(e)
								reject1(e)
							})
						}
						else {
							localLog("Iterating through messages")
							i = 0;
							firstMessage = msgs.first();
							msgs.forEach(msg => {
								i++;
								if (msg.createdTimestamp < firstMessage.createdTimestamp)
									firstMessage = msg;
								
								if (i === msgs.size)
									resolve(firstMessage)
							})
						}
					})
					.then(firstMessage => {
						localLog("Oldest of fetched found")
						if (msgs.size != limit) {
							localLog("First message found: " + firstMessage.id)
							resolve1(firstMessage)
						}
						else {
							localLog("Continue searching before: "+ firstMessage.id)
							fetchFirstMessage(firstMessage.id)
						}
					})
				})
				.catch(e => {
					reject1(e);
				})
			}
			
			if (chan.lastMessageId == null) {
				localLog("Pas de messages dans le channel")
				resolve1(null)
			}
			else {
				localLog("Starting fetch from start")
				fetchFirstMessage(chan.lastMessageId);
			}
		})
	})
}


let archiveMsgCreate = (GLOBAL, message) => {
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
}

let archiveMsgDelete = (GLOBAL, paramMessageId) => {
	let localLog = (e) => {
		console.log(e)
	}
	
	GLOBAL.con.query("SELECT * FROM `SaveBotMessages` AS M JOIN `SaveBotChannels` AS C ON C.`originId` = M.`channelId` WHERE `messageId` = " + GLOBAL.con.escape(paramMessageId) +";", 
	(err, res, fields) => {
		if (err) {
			console.log(err)
		}
		else if (typeof(res[0]) != "undefined") {
			res = res[0];
			GLOBAL.bot.channels.fetch(res.destId).then(chan => {
				chan.messages.fetch(res.saveId).then(msg => {
					new Promise( (resolve) => {
						if(msg.embeds.length == 0) {
							resolve([])
						}
						else {
							let i = 0;
							let embedArray = []
							msg.embeds.forEach(emb => {
								i++;
								embedArray.push(emb);
								if (i == msg.embeds.length) {
									resolve(embedArray)
								}
							})
						}
					})
					.then(embedArray => {
						let embed = embedArray[embedArray.length - 1]
						
						let mtn = new Date();
						
						if (embedArray.length == 0 || embed.fields.length == 24 || embed.fields.length == 0) {
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

let archiveMsgUpdate = (GLOBAL, paramMessageId) => {
			
	let localLog = (e) => {
		console.log(e)
	}
	
	GLOBAL.con.query("SELECT * FROM `SaveBotMessages` AS M JOIN `SaveBotChannels` AS C ON C.`originId` = M.`channelId` WHERE `messageId` = " + GLOBAL.con.escape(paramMessageId) +";", 
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
								chanArchive.send(messageOptions)
								msg.edit({
									content: (msgOrigin.deleted ? "(deleted) " : "") + (msgOrigin.editedTimestamp ? "(edited) " : "") + "> BOT: "+ msgOrigin.author.username +", MessageId: `"+ msgOrigin.id +"` (updated on `"+ new Date() +"`)\n" + msgOrigin.content,
									embeds : msg.embeds,
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

exports.archiveChannel = archiveChannel;
exports.archiveMessage = archiveMessage;
exports.getArchiveChannelId = getArchiveChannelId;
exports.fetchFirstMessageChannel = fetchFirstMessageChannel;

exports.archiveMsgCreate = archiveMsgCreate;
exports.archiveMsgDelete = archiveMsgDelete;
exports.archiveMsgUpdate = archiveMsgUpdate;