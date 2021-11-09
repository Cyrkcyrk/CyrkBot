exports.messageDelete = (GLOBAL, message) => {
	return new Promise((resolve, reject) => {
		const args = message.content.trim().split(/ +/g);
		args.shift();
		
		console.log(args);
		if (args.length == 1) {
			message.channel.messages.fetch(args[0]).then(msg => {
				if (msg) {
					msg.delete()
					.then(_ => {
						resolve("Message deleted");
						return;
					}).catch(e => {
						e._logC = "Error: message fetched but error while deleting."
						reject(e)
						return;
					})
				}
			}).catch(e => {
				message.reply("Error: couldn't fetch message : `"+ args[0] +"`")
				.then(_ => {
					reject("Error: couldn't fetch message : `"+ args[0] +"`")
					return;
				})
			});
		}
		else if (args.length == 2) {
			GLOBAL.guild.channels.fetch(args[0])
			.then(_channel => {
				_channel.messages.fetch(args[1])
				.then(_msg => {
					if (_msg) {
						_msg.delete()
						.then(_ => {
							
							if (message.channel.id != args[0]) {
								message.reply("Message deleted");
							}
							resolve("Message deleted");
							return;
						}).catch(e => {
							e._logC = "Error: message fetched but error while deleting."
							reject(e)
							return;
						})
					}
				}).catch(e => {
					message.reply("Error: couldn't fetch message: `"+ args[1] +"`")
					.then(_ => {
						reject("Error: couldn't fetch message: `"+ args[1] +"`")
						return;
					})
				});
			}).catch(e => {
				message.reply("Error: couldn't fetch channel: `"+ args[0] +"`")
				.then(_ => {
					reject("Error: couldn't fetch channel: `"+ args[0] +"`")
					return;
				})
			});
		}
		else if (args.length == 3) {
			GLOBAL.bot.guilds.fetch(args[0])
			.then(_guild => {
				_guild.channels.fetch(args[1])
				.then(_channel => {
					_channel.messages.fetch(args[2])
					.then(_msg => {
						if (_msg) {
							_msg.delete()
							.then(_ => {
								if (message.channel.id != args[1]) {
									message.reply("Message deleted");
								}
								resolve("Message deleted");
								return;
							}).catch(e => {
								e._logC = "Error: message fetched but error while deleting."
								reject(e)
								return;
							})
						}
					}).catch(e => {
						message.reply("Error: couldn't fetch message: `"+ args[2] +"`")
						.then(_ => {
							reject("Error: couldn't fetch message: `"+ args[2] +"`")
							return;
						})
					});
				}).catch(e => {
					message.reply("Error: couldn't fetch channel: `"+ args[1] +"`")
					.then(_ => {
						reject("Error: couldn't fetch channel: `"+ args[1] +"`")
						return;
					})
				});
			}).catch(e => {
				message.reply("Error: couldn't fetch guild: `"+ args[0] +"`")
				.then(_ => {
					reject("Error: couldn't fetch guild: `"+ args[0] +"`")
					return;
				})
			});
		}
		else {
			message.reply("Error: too few / many arguments: `"+ GLOBAL.local.prefix +"delete {guildID} {channelID} [messageID]`")
			.then(_ => {
				reject("Error: too few / many arguments: `"+ GLOBAL.local.prefix +"delete {guildID} {channelID} [messageID]`");
				return;
			})
		}
	})
}