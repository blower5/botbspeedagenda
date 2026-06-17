function parse_day(d) {
	return ["sun","mon","tue","wed","thu","fri","sat"][d];
}

//days since the unix epoch in user timezone
function days_from_epoch(ts) {
	let now = new Date();
	return Math.floor(ts/86400000 - now.getTimezoneOffset()/1440);
}

//returns only battles which have ended
function only_ended_battles(battles_list) {
	let a = [];
	for (i in battles_list) {
		if (battles_list[i].period == "end") a.push(battles_list[i]);
	}
	return a;
}

//always returns YYYY-MM-DD format current date in timezone
function assemble_datestring() {
	let now = new Date();
	let [m,d] = [(now.getMonth()+1).toString(),now.getDate().toString()];
	return now.getFullYear().toString()+"-"+(m.length-1?m:"0"+m)+"-"+(d.length-1?d:"0"+d);
}


//The text shadow color is the average of all 5 palette colors. Really!
//Takes the full concatenated palette hex and averages it.
function getTextShadow(hex) {
	let [r, g, b] = [0, 0, 0];
	let a = "";
	
	for (let i = 0; i < 30; i+=6) {
		r += parseInt( hex.slice(i  ,i+2), 16 );
		g += parseInt( hex.slice(i+2,i+4), 16 );
		b += parseInt( hex.slice(i+4,i+6), 16 );
	}
	//normalize, convert to hex, pad with a 0 if necessary, and concatenate
	[r, g, b].forEach(color => 
		a += Math.floor(color*.2).toString(16).padStart(2,"0")
	);
	
	return a;
}

//update palette cookies
function updatePalette(id) {
	if (id == id.match(/[0-9]+/)[0]) { //pass numbers only
		let palettereq = new XMLHttpRequest();
		palettereq.addEventListener('load', (event) => setPaletteCookies(palettereq));
		palettereq.open('GET', 'https://battleofthebits.com/api/v1/palette/load/' + encodeURIComponent(id));
		palettereq.responseType = 'json';
		palettereq.send();
	}
}

//return value for a cookie's name
function getCookie(name){
	var pattern = RegExp(name + "=.[^;]*")
	var matched = document.cookie.match(pattern)
	if(matched){
		var cookie = matched[0].split('=')
		return cookie[1]
	}
	return false
}

//synthesize a big hex number of all the hexcodes concatenated and store
function setPaletteCookies(botbpalette) {
	let r = botbpalette.response;
	document.cookie = "palette="+r.color1+r.color2+r.color3+r.color4+r.color5+";max-age=31536000;SameSite=Strict";
	location.reload()
}


window.addEventListener('DOMContentLoaded', (event) => {
	let canvas = document.getElementById('main');
	let width = canvas.clientWidth;   //probably 960px
	let height = canvas.clientHeight; //probably 720px
	let ctx = canvas.getContext('2d');

	//columns are drawn in this ratio
	//| 1 |   6   |   6   |   6   |   6   |   6   |   6   |   6   | 
	//1 + 6*7 = 43

	//rows look like this (different units)
	//-----
	//  1
	//-----
	//  ...
	//
	//  12 (24 rows * 0.5)
	//
	//  ...
	//-----

	let xunit = width / 43;
	let yunit = height / 13;

	let paddingpx = 2;
	let linethickness = 1;

	let dayfontpx = 18;
	let dayfontcolor = "white";
	
	let fontpx = 11;
	let fontcolor = "white";

	let bgAMcolor = 		'#4a4540';
	let bgPMcolor = 		'#40454a';
	let bgheadercolor = 	'#404040';
	let bggridcolor =		'#fff4';

	let battlecolor1 = 		'#975a';
	let battlecolor2 =  	'#579a';
	let pastbattlecolor1  = '#000a';
	let pastbattlecolor2  = '#222a';

	
	
	
	function draw_outlined_text(t,x,y,color="white",coloroutline="black") {
		ctx.fillStyle = coloroutline;
		ctx.fillText(t,x-1,y-1);
		ctx.fillText(t,x+1,y-1);
		ctx.fillText(t,x-1,y+1);
		ctx.fillText(t,x+1,y+1);
		ctx.fillStyle = color;
		ctx.fillText(t,x,y);
	}

	//draws boxes for every battle in a list, takes 2 colors to alternate between
	function draw_battle_list(battles_list, color1, color2) {
		for (let i in battles_list) {
		
			//filter non-xhb out
			if (battles_list[i].type != 3) return;

			ctx.fillStyle = i%2?color1:color2;
			
			st = new Date(battles_list[i]["period_data"][0]["start"]*1000);
			et = new Date(battles_list[i]["period_data"][0]["end"]*1000);
			
			let now = new Date();
			
			let start_days_remaining = days_from_epoch(st.getTime()) - days_from_epoch(now.getTime());
			let end_days_remaining =   days_from_epoch(et.getTime()) - days_from_epoch(now.getTime());
			let start_decimal_hours_absolute = st.getHours() + st.getMinutes()/60;
			let end_decimal_hours_absolute = et.getHours() + et.getMinutes()/60;
			
			if (start_days_remaining != end_days_remaining) {
				//this xhb crosses the day boundry, must be drawn in two parts

				ctx.fillRect(xunit*6*start_days_remaining+xunit, yunit+yunit/2*start_decimal_hours_absolute, xunit*6-paddingpx, yunit/2*(24 - start_decimal_hours_absolute));
				
				ctx.fillRect(xunit*6*end_days_remaining+xunit, yunit, xunit*6-paddingpx, yunit/2*end_decimal_hours_absolute);
				
				ctx.font = fontpx + "px sans-serif";
				draw_outlined_text(battles_list[i].title, xunit*6*start_days_remaining+xunit, yunit+yunit/2*start_decimal_hours_absolute + fontpx, fontcolor);
			} else {
				ctx.fillRect(xunit*6*start_days_remaining+xunit, yunit+yunit/2*start_decimal_hours_absolute, xunit*6-paddingpx, yunit/2*(end_decimal_hours_absolute - start_decimal_hours_absolute));
				
				ctx.font = fontpx + "px sans-serif";
				draw_outlined_text(battles_list[i].title, xunit*6*start_days_remaining+xunit, yunit+yunit/2*start_decimal_hours_absolute + fontpx, fontcolor);
			}
		}
	}

	//clear and draw empty schedule
	function clear() {
		let now = new Date();
		
		ctx.clearRect(0, 0, width, height);
		//top left box
		ctx.fillStyle = bgheadercolor;
		ctx.fillRect(0, 0, xunit-paddingpx, yunit-paddingpx);
		
		//ruler am
		ctx.fillStyle = bgAMcolor;
		ctx.fillRect(0, yunit, xunit-paddingpx, 6*yunit-paddingpx);
		ctx.fillStyle = bgPMcolor;
		ctx.fillRect(0, 7*yunit, xunit-paddingpx, 6*yunit-paddingpx);
		
		ctx.font = fontpx + "px sans-serif";
		for (let j=	0; j < 24; j++) {	
			//ruler 24 hour grid
			ctx.fillStyle = bggridcolor;
			ctx.fillRect(0, yunit/2*j + yunit + 1, xunit-paddingpx, linethickness);
			
			//hour numbers
			draw_outlined_text(j.toString().length-1?j:"0"+j, 3, yunit/2*j + yunit + 1 + fontpx);
			
		}
		
		
		//header boxes and main (big) boxes
		for (let i = 0; i < 7; i++) {
			
			//header box
			ctx.fillStyle = bgheadercolor;
			ctx.fillRect(xunit*6*i+xunit, 0, xunit*6-paddingpx, yunit-paddingpx);
			
			//header day text
			ctx.font = dayfontpx + "px sans-serif";
			d = new Date(now.getTime() + i*24*3600000);
			draw_outlined_text( parse_day(d.getDay()) + " " + d.getMonth().toString() + "/" + d.getDate().toString(), xunit*6*i+xunit + 10, dayfontpx + yunit/4, dayfontcolor);
			
			//big box am
			ctx.fillStyle = bgAMcolor;
			ctx.fillRect(xunit*6*i+xunit, yunit, xunit*6-paddingpx, 6*yunit-paddingpx);
			//big box pm
			ctx.fillStyle = bgPMcolor;
			ctx.fillRect(xunit*6*i+xunit, 7*yunit, xunit*6-paddingpx, 6*yunit-paddingpx);
			
			ctx.fillStyle = bggridcolor;
			for (let j=0; j < 24; j++) {
				//big boxes 24 hour grid
				ctx.fillRect(xunit*6*i+xunit, yunit/2*j + yunit + 1, xunit*6-paddingpx, linethickness);
			}
		}
	}		

	//draw the little pin shaped marker
	function draw_current_time_marker() {
		let now = new Date();
		let current_decimal_hours = now.getHours() + now.getMinutes()/60;
		ctx.fillStyle = "#fff";
		ctx.fillRect(xunit, yunit+yunit/2*current_decimal_hours, xunit*6-paddingpx, linethickness);
		
		ctx.beginPath();
		ctx.arc(xunit, yunit+yunit/2*current_decimal_hours, 5, 0, 6.28);
		ctx.fill();
	}

	
	
	
	
	
	
	// ----------------------------------------------------------------------------------------------------------
	//    palette control
	//
	var storedPalette = getCookie("palette");
	if (storedPalette) {
		document.documentElement.style.cssText = "--color1: #"+storedPalette.slice(0,6)+
		"; --color2: #"+storedPalette.slice(6,12)+
		"; --color3: #"+storedPalette.slice(12,18)+
		"; --color4: #"+storedPalette.slice(18,24)+
		"cc; --color5: #"+storedPalette.slice(24,30)+
		"; --textshadow: #"+getTextShadow(storedPalette)+";";
	}
	
	//run on enter key in palette text input
	var paletteinput = document.getElementById('pinput');
	paletteinput.addEventListener('change', (event) => {
		updatePalette(paletteinput.value);
	});
	// ----------------------------------------------------------------------------------------------------------

	
	
	
	//the full draw cycle, which runs every minute
	function draw() {

		//two seperate requests: current, which shows all unclosed battles and battles to come
		//through the next week, and a second one which grabs the battles that already happened today.

		let first_response = true;

		let req = new XMLHttpRequest();
		req.addEventListener('load', (event) => {
			if (first_response) {
				clear();
				first_response = false;
			}
			draw_battle_list(req.response,battlecolor1,battlecolor2);
			draw_current_time_marker();
		});
		req.open("GET", "https://battleofthebits.com/api/v1/battle/current");
		req.responseType = 'json';
		req.send();

		reqold = new XMLHttpRequest();
		reqold.addEventListener('load', (event) => {
			if (first_response) {
				clear();
				first_response = false;
			}
			let arr = only_ended_battles(reqold.response);
			draw_battle_list(arr,pastbattlecolor1,pastbattlecolor2);
		});
		reqold.open("POST", "https://battleofthebits.com/api/v1/battle/list");
		reqold.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		reqold.responseType = 'json';
		reqold.send(  encodeURI('sort=start&desc=true&conditions[0][property]=end&conditions[0][operator]=LIKE&conditions[0][operand]='+assemble_datestring()+'%')  );
	}
	
	//if we get the graphix up as soon as possible it looks better, so extra half-draw call before the
	//http requests come in
	clear();
	draw_current_time_marker();
	
	draw();
	setInterval(draw,120000);
	
	
	
});