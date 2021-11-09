const local = require('./local.js');
const {Client, Intents} = require('discord.js');
const util = require('util')

let GLOBAL = {}


let {channelTree} = require("./channelTree.js")
let {messageDelete} = require("./messageDelete.js")
let {messageSend} = require("./messageSend.js")


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
			case 'say': {
				if (message.author.id == "292808250779369482")
				{
					let message_trim = message.content.substring((GLOBAL.local.prefix + 'say ').length);
					message.delete()
					.then(_ => {
						message.channel.send(message_trim)
					});
				}
				break;
			}
			case 'send' : {
				if (message.author.id == "292808250779369482") {
					let messageTrim = message.content.substring((GLOBAL.local.prefix + 'send ').length);
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
			case 'ssend' : {
				if (message.author.id == "292808250779369482") {
					
					let channelID = args[0];
					let messageTrim = message.content.substring((GLOBAL.local.prefix + 'send ' + args[0] + " ").length);
					
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
			
		}
	}
})
