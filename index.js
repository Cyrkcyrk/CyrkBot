// const functions = require('./functions.js');
// const local = require('./local.js');
const {Client, Intents} = require('discord.js');

let GLOBAL = {}

// GLOBAL.local = local;

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
	functions.log("Bot connecté");
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
	else {
		const args = message.content.trim().split(/ +/g);
		const command = args.shift().toLowerCase().slice(GLOBAL.local.prefix.length);;
		
		console.log(command);
		switch (command) {
			case 'ping': {
				message.reply("Pong !");
				break;
			}
			case 'reload':  {
				if (message.author.id == "292808250779369482")
				{
					message.reply("Restarting Rose").then(_ => {
						process.exit();
					})
				}
				break;
			}
		}
	}
})
