function parse_day(d) {
	return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d];
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

//rrggbb rrggbb
function average_two_colors(c1,c2) {
	let [r, g, b] = [0, 0, 0];
	let a = "";
	
	r = parseInt(c1.slice(0,2),16) + parseInt(c2.slice(0,2),16);
	g = parseInt(c1.slice(2,4),16) + parseInt(c2.slice(2,4),16);
	b = parseInt(c1.slice(4,6),16) + parseInt(c2.slice(4,6),16);
	
	[r, g, b].forEach(color => 
		a += Math.floor(color*.5).toString(16).padStart(2,"0")
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
	let canvastop = document.getElementById('top');
	let width = canvas.clientWidth;   //probably 960px
	let height = canvas.clientHeight; //probably 720px
	let ctx = canvas.getContext('2d');
	let ctxtop = canvastop.getContext('2d');




	// ----------------------------------------------------------------------------------------------------------
	//    palette control
	//
	var storedPalette = getCookie("palette");
	//synthesizing more colors here, for more complex visuals
	//quite annoyingly this needs to be both js and css variables
	let [palettecolor1,palettecolor2,palettecolor3,palettecolor4,palettecolor5,palettecolorshadow,palettecolor34,palettecolor45] = ["#cacaca","#f76700","#4a3553","#000000cc","#3e2239","#666666","#251a29","#1f111c"];
	if (storedPalette) {
		let c34 = average_two_colors(storedPalette.slice(12,18),storedPalette.slice(18,24));
		let c45 = average_two_colors(storedPalette.slice(18,24),storedPalette.slice(24,30));
		let ts  = getTextShadow(storedPalette);
		document.documentElement.style.cssText = "--color1: #"+storedPalette.slice(0,6)+
		"; --color2: #"+storedPalette.slice(6,12)+
		"; --color3: #"+storedPalette.slice(12,18)+
		"; --color4: #"+storedPalette.slice(18,24)+
		"cc; --color5: #"+storedPalette.slice(24,30)+
		"; --textshadow: #"+ts+
		"; --color34: #"+c34+
		"; --color45: #"+c45+
		";";
		[palettecolor1,palettecolor2,palettecolor3,palettecolor4,palettecolor5,palettecolorshadow,palettecolor34,palettecolor45] = [storedPalette.slice(0,6),storedPalette.slice(6,12),storedPalette.slice(12,18),storedPalette.slice(18,24),storedPalette.slice(24,30),ts,c34,c45].map(c => "#"+c.toString());
	}
	
	//run on enter key in palette text input
	var paletteinput = document.getElementById('pinput');
	paletteinput.addEventListener('change', (event) => {
		updatePalette(paletteinput.value);
	});
	// ----------------------------------------------------------------------------------------------------------







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
	let yunit = (height-20)/ 13; //padding introduced because its cutting the bottom off???

	let paddingpx = 4;
	let linethickness = 1;

	let dayfontpx = 17;
	let dayfontcolor = palettecolor1;
	
	let fontpx = 11;
	let fontcolor = palettecolor1;
	
	let fontoutlinecolor = palettecolorshadow + "66";

	let bgAMcolor = 		palettecolor4;
	let bgPMcolor = 		palettecolor4;
	let bggridcolor =		palettecolor1+"66";

	let borderradius = 4;
	
	let topshadegradient = ctx.createLinearGradient(0,0,0,35);
	topshadegradient.addColorStop(0, "#8A8A8A2B");
	topshadegradient.addColorStop(1, "#8A8A8A00");
	
	
	function draw_outlined_text(t,x,y,color="white",coloroutline="black") {
		ctx.fillStyle = coloroutline;
		ctx.fillText(t,x-1,y+1);
		ctx.fillText(t,x+1,y+1);
		ctx.fillText(t,x,y+1);
		ctx.fillText(t,x,y+2);
		ctx.fillStyle = color;
		ctx.fillText(t,x,y);
	}

	//recreation of fillRect with divs. this way you can click on them, and some other stuff.
	function drawdiv(x,y,w,h,txt = "",extraclass=""){
		let maindiv = document.getElementById("maindiv");
		let div = document.createElement("div");
		div.className = "fixed "+extraclass;
		div.style = "width:"+(w-10)+"px;height:"+(h-10)+"px;left:"+x+"px;top:"+y+"px;";
		div.textContent = txt.toString();
		maindiv.appendChild(div);
	}
	
	//recreation of fillRect with divs. this one is a hyperlink.
	function drawdivlink(x,y,w,h,txt,txt2 = "",hrf="",extraclass=""){
		let maindiv = document.getElementById("maindiv");
		let a = document.createElement("a");
		let div = document.createElement("div");
		let small = document.createElement("small");
		let span = document.createElement("span");
		
		div.className = "fixed "+extraclass;
		div.style = "width:"+(w-10)+"px;height:"+(h-10)+"px;left:"+x+"px;top:"+y+"px;";
		
		span.textContent = txt.toString();
		small.textContent = txt2.toString();
		
		div.appendChild(small);
		div.appendChild(span);
		
		a.href = hrf;
		a.appendChild(div);
		maindiv.appendChild(a);
	}

	//draws boxes for every battle in a list, takes 2 colors to alternate between
	function draw_battle_list(battles_list, old=false) {
		for (let i in battles_list) {
		
			//filter non-xhb out
			if (battles_list[i].type != 3) return;

			let cl = i%2?"battle newbattle1":"battle newbattle2";
			if (old) cl = i%2?"battle oldbattle1":"battle oldbattle2";
			
			st = new Date(battles_list[i]["period_data"][0]["start"]*1000);
			et = new Date(battles_list[i]["period_data"][0]["end"]*1000);
			
			let now = new Date();
			
			let start_days_remaining = days_from_epoch(st.getTime()) - days_from_epoch(now.getTime());
			let end_days_remaining =   days_from_epoch(et.getTime()) - days_from_epoch(now.getTime());
			let start_decimal_hours_absolute = st.getHours() + st.getMinutes()/60;
			let end_decimal_hours_absolute = et.getHours() + et.getMinutes()/60;
			
			//filter out battles more than a week away
			if (start_days_remaining > 6) return;
			
			if (start_days_remaining != end_days_remaining) {
				//this xhb crosses the day boundry, must be drawn in two parts

				drawdivlink(xunit*6*start_days_remaining+xunit, yunit+yunit/2*start_decimal_hours_absolute, xunit*6-paddingpx, yunit/2*(24 - start_decimal_hours_absolute), battles_list[i].title, battles_list[i].start.slice(11,16), battles_list[i].profileURL, cl);
				
				drawdivlink(xunit*6*end_days_remaining+xunit, yunit, xunit*6-paddingpx, yunit/2*end_decimal_hours_absolute, "", "", cl);
				
			} else {
				drawdivlink(xunit*6*start_days_remaining+xunit, yunit+yunit/2*start_decimal_hours_absolute, xunit*6-paddingpx, yunit/2*(end_decimal_hours_absolute - start_decimal_hours_absolute), battles_list[i].title, battles_list[i].start.slice(11,16), battles_list[i].profileURL, cl);
			}
		}
	}

	//clear and draw empty schedule
	function clear() {
		let now = new Date();
		
		//clear the canvases and the divs out
		ctx.clearRect(0, 0, width, height);
		ctxtop.clearRect(0, 0, width, height);
		document.getElementById("maindiv").innerHTML = "";
		
		//top left box
		ctx.fillStyle = palettecolor3;
		ctx.beginPath();
		ctx.roundRect(0, 0, xunit-paddingpx, yunit-paddingpx, borderradius);
		ctx.fill()
		ctx.fillStyle = topshadegradient;
		ctx.beginPath();
		ctx.roundRect(0, 0, xunit-paddingpx, yunit-paddingpx, borderradius);
		ctx.fill();
		
		//ruler am
		ctx.fillStyle = palettecolor3;
		ctx.beginPath();
		ctx.roundRect(0, yunit, xunit-paddingpx, 6*yunit-paddingpx, borderradius);
		ctx.fill()
		//ruler pm
		ctx.beginPath();
		ctx.roundRect(0, 7*yunit, xunit-paddingpx, 6*yunit, borderradius);
		ctx.fill()
		
		
		ctx.font = fontpx + "px sans-serif";
		for (let j=	0; j < 24; j++) {	
			//ruler 24 hour grid
			if (j%12!=0) {
				ctx.fillStyle = bggridcolor;
				ctx.fillRect(0, yunit/2*j + yunit + 1, xunit-paddingpx, linethickness);
			}
			//hour numbers
			ctx.textAlign = "left";
			draw_outlined_text(j.toString().length-1?j:"0"+j, 3, yunit/2*j + yunit + 1 + fontpx, palettecolor1, fontoutlinecolor);
			
		}
		
		
		//header boxes and main (big) boxes
		for (let i = 0; i < 7; i++) {
			
			//header box
			ctx.fillStyle = palettecolor3;
			ctx.beginPath();
			ctx.roundRect(xunit*6*i+xunit, 0, xunit*6-paddingpx, yunit-paddingpx, borderradius);
			ctx.fill();
			
			ctx.fillStyle = topshadegradient;
			ctx.beginPath();
			ctx.roundRect(xunit*6*i+xunit, 0, xunit*6-paddingpx, yunit-paddingpx, borderradius);
			ctx.fill();
			
			//header day text
			ctx.textAlign = "center";
			ctx.font = "bold " + dayfontpx + "px Verdana";
			let d = new Date(now.getTime() + i*24*3600000);
			draw_outlined_text( parse_day(d.getDay()) + " " + (d.getMonth()+1).toString() + "/" + d.getDate().toString(), xunit*6*i+xunit*4 - 3, dayfontpx + yunit/4, palettecolor1, fontoutlinecolor);
			
			//big box am
			ctx.fillStyle = bgAMcolor;
			ctx.fillRect(xunit*6*i+xunit, yunit, xunit*6-paddingpx, 6*yunit-paddingpx);
			//big box pm
			ctx.fillStyle = bgPMcolor;
			ctx.fillRect(xunit*6*i+xunit, 7*yunit, xunit*6-paddingpx, 6*yunit);
			
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
		ctxtop.fillStyle = palettecolor1;
		ctxtop.fillRect(xunit, yunit+yunit/2*current_decimal_hours, xunit*6-paddingpx, linethickness);
		
		ctxtop.beginPath();
		ctxtop.arc(xunit, yunit+yunit/2*current_decimal_hours, 5, 0, 6.28);
		ctxtop.fill();		
		
		ctxtop.fillStyle = palettecolor2;
		ctxtop.beginPath();
		ctxtop.arc(xunit, yunit+yunit/2*current_decimal_hours, 3, 0, 6.28);
		ctxtop.fill();
	}

	
	
	
	
	
	
	

	
	
	
	//the full draw cycle, which runs every minute
	function draw() {

		//two seperate requests: /current, which shows all unclosed battles and future battles
		//and a second one which grabs the battles that already happened today. this second one
		//uses a post request to filter for battles that happened today, and then filters out
		//battles that haven't reached the "end" period by passing the result to a function.
		//Additionally, they need to account for a race condition so clear() only gets called
		//once. Although the time marker needs to be drawn on top, it will only ever need to be
		//above an active battle, so this is handled in the /current request's callback.

		let first_response = true;

		let req = new XMLHttpRequest();
		req.addEventListener('load', (event) => {
			if (first_response) {
				clear();
				first_response = false;
			}
			draw_battle_list(req.response);
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
			draw_battle_list(arr,true);
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