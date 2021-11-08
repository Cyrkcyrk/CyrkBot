// const functions = require('./functions.js');
const local = require('./local.js');
const {Client, Intents} = require('discord.js');

let GLOBAL = {}

GLOBAL.local = local;

GLOBAL.bot = new Client({intents : [
	Intents.FLAGS.GUILDS, 
	Intents.FLAGS.GUILD_MEMBERS,
	Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
	Intents.FLAGS.DIRECT_MESSAGES,
	Intents.FLAGS.DIRECT_MESSAGE_REACTIONS  
],  partials: ["CHANNEL"]});

GLOBAL.bot.login(local.bot.TOKEN)

GLOBAL.bot.on('ready', () => {
	console.log("Bot connecté");
	
	GLOBAL.bot.guilds.fetch(GLOBAL.local.bot.GUILDID)
	.then(_guild => {
		GLOBAL.guild = _guild;
		
		_guild.members.fetch("292808250779369482")
		.then(_cyrk => {
			console.log(_cyrk.nickname)
			console.log(GLOBAL.bot.user.id)
			
			_guild.members.fetch(GLOBAL.bot.user.id)
			.then(_bot => {
				console.log(_bot)
				_bot.setNickname(_cyrk.nickname);
			})
		})
		
		
	});
	
	// functions.init(GLOBAL);
	// GLOBAL.bot.user.setActivity({
		// name: "you",
		// type: "WATCHING"
	// })
})

.on('messageCreate', (message) =>{	
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
					message.delete().catch(e => {console.log("Couldn't delete ordering message")});
					console.log(args);
					if (args.length == 1) {
						message.channel.messages.fetch(args[0]).then(msg => {
							if (msg) {
								msg.delete()
								.then(_ => {
									console.log("Message deleted");
								}).catch(e => {
									console.log("Error: message fetched but error while deleting.")
									console.log(e)
								})
							}
						}).catch(e => {message.reply("Error: couldn't fetch message : `"+ args[0] +"`")});;
					}
					else if (args.length == 2) {
						
						GLOBAL.guild.channels.fetch(args[0])
						.then(_channel => {
							_channel.messages.fetch(args[1])
							.then(_msg => {
								if (_msg) {
									_msg.delete()
									.then(_ => {
										console.log("Message deleted");
										if (message.channel.id != args[0]) {
											message.reply("Message deleted");
										}
									}).catch(e => {
										console.log("Error: message fetched but error while deleting.")
										console.log(e)
									})
								}
							}).catch(e => {message.reply("Error: couldn't fetch message: `"+ args[1] +"`")});
						}).catch(e => {message.reply("Error: couldn't fetch channel: `"+ args[0] +"`")});
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
											console.log("Message deleted");
											if (message.channel.id != args[1]) {
												message.reply("Message deleted");
											}
										}).catch(e => {
											console.log("Error: message fetched but error while deleting.")
											console.log(e)
										})
									}
								}).catch(e => {message.reply("Error: couldn't fetch message: `"+ args[2] +"`")});
							}).catch(e => {message.reply("Error: couldn't fetch channel: `"+ args[1] +"`")});
						}).catch(e => {message.reply("Error: couldn't fetch guild: `"+ args[0] +"`")});
					}
					else {
						message.reply("Error: too few / many arguments: `"+ GLOBAL.local.prefix +"delete {guildID} {channelID} [messageID]`");
					}
				}
				break;
			}
		}
	}
})
