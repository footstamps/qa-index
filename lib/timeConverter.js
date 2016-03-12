module.exports = {
	
	date_2_timestamp: function(datetime){
		return new Date(datetime).getTime()/1000;
	},
	
	timestamp_2_date: function(UNIX_timestamp){
		var a = new Date(UNIX_timestamp * 1000);
	
		var yyyy = a.getFullYear().toString();
		var MM = (a.getMonth()+1).toString();
		var dd = a.getDate().toString();
		//var hour = a.getHours();
		//var min = a.getMinutes();
		//var sec = a.getSeconds();
		
		var time = yyyy + (MM[1]?MM:"0"+MM[0]) + (dd[1]?dd:"0"+dd[0]); 
	
		return time;
	}
	
}