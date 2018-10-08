module.exports = {
	isDebug: true,
	showtip: function(tip){
		console.log("----------"+tip+"----------")
	},
	err: function(title, msg){
		if(!this.isDebug) return
		this.showtip("err start")
		console.log(title)
		console.error(msg)
		this.showtip("err end")
	},
	info: function(title, msg){
		if(!this.isDebug) return
		this.showtip("info start")
		console.log(title)
		console.info(msg)
		this.showtip("info end")
	},
	log: function(title, msg){
		if(!this.isDebug) return
		this.showtip("log start")
		console.log(title)
		console.log(msg)
		this.showtip("log end")
	}
}