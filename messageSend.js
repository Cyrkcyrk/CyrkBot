exports.messageSend = (GLOBAL, message, channelId, messageTxt) => {
	return new Promise((resolve, reject) => {
		console.log(channelId, " - ", messageTxt)
		GLOBAL.bot.channels.fetch(channelId)
		.then(_channel => {
			_channel.send(messageTxt)
			.then(_ => {
				resolve("Success")
				return;
			}).catch(e => {
				console.log(e);
				message.reply("Error: couldn't send message: `"+ messageTxt +"`")
				.then(_ => {
					reject("Error: couldn't send message: `"+ messageTxt +"`")
					return;
				})
			});
		}).catch(e => {
			console.log(e);
			message.reply("Error: couldn't fetch channel: `"+ channelId +"`")
			.then(_ => {
				reject("Error: couldn't fetch channel: `"+ channelId +"`")
				return;
			})
		})
	});
}