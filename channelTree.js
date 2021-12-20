
exports.channelTree = (GLOBAL, guild) => {
	return new Promise((resolve) => {
		
		let chanArray = []
		let chanGlobal = {
			"null" : {
				type : "GUILD_CATEGORY",
				parent : null,
				id : null,
				name : "null",
				pos : -1,
				subChan : []
			}
		}
		var itemsProcessed = 0;
		guild.channels.cache.forEach(chan => {
			itemsProcessed++;
			let chanObj = {
				type : chan.type,
				parent : chan.parentId,
				id : chan.id,
				name : chan.name,
				pos : chan.rawPosition
			}
			
			if (chan.id === "884123995262292029")
				console.log(chan)
			
			if (chan.type === "GUILD_CATEGORY") {
				chanObj["subChan"] = [];
				chanGlobal[chan.id] = chanObj;
			}
			else {
				chanArray.push(chanObj)
			}
			
			if (itemsProcessed >= guild.channels.cache.size) {
				itemsProcessed = 0;
				chanArray.forEach(chan => {
					itemsProcessed++;
					if (chan.parent == null) {
						chanGlobal["null"]["subChan"].push(chan)
					}
					else {
						chanGlobal[chan.parent]["subChan"].push(chan)
					}
					if (itemsProcessed === chanArray.length) {
						itemsProcessed = 0;
						chanArray = []
						Object.keys(chanGlobal).forEach(key => {
							itemsProcessed++;
							chanArray.push(chanGlobal[key])
							chanGlobal[key].subChan.sort((a, b) => {
								if (a.pos > b.pos)
									return 1;
								else
									return -1;
							})
							if (itemsProcessed === Object.keys(chanGlobal).length) {
								
								chanArray.sort((a, b) => {
									if (a.pos > b.pos)
										return 1;
									else
										return -1;
								})
								resolve(chanArray);
								// console.log(util.inspect(chanArray, {showHidden: false, depth: null, colors: true}))
							}
						})
					}
				})
			}
		})
	})
}