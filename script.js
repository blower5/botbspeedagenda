let SHIFT = 0;


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

function clockstring(h,m) {
	let h2 = h.toString();
	h2 = (h2.length-1)?h2:"0"+h2;
	let m2 = m.toString();
	m2 = (m2.length-1)?m2:"0"+m2;
	return h2 + ":" + m2;
}

function textdisplay(t) {
	document.getElementById("textdisplaywrite").textContent = t;
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
	var pattern = RegExp(name + "=.[^;]*");
	var matched = document.cookie.match(pattern);
	if(matched){
		var cookie = matched[0].split('=');
		return cookie[1];
	}
	return false;
}

//synthesize a big hex number of all the hexcodes concatenated and store
function setPaletteCookies(botbpalette) {
	let r = botbpalette.response;
	document.cookie = "palette="+r.color1+r.color2+r.color3+r.color4+r.color5+";max-age=31536000;SameSite=Strict";
	location.reload()
}

function updateSpritesheet() {
	let spritesheetidreq = new XMLHttpRequest();
	spritesheetidreq.addEventListener('load', (event) => {
		let spritesheetversion = spritesheetidreq.response.spriteshit_version;
		
		let lnk = document.createElement("link");
		lnk.rel = "stylesheet";
		lnk.href = "https://battleofthebits.com/styles/spriteshit/"+spritesheetversion+".css";
		
		document.head.appendChild(lnk);
	});
	spritesheetidreq.open('GET', 'https://battleofthebits.com/api/v1/spriteshit/version/');
	spritesheetidreq.responseType = 'json';
	spritesheetidreq.send();
}

function skull(){
	s = document.createElement("style")
	s.textContent = `
		* {
			background-image: url(./badassskeleton.png) !important;
			background-attachment: fixed !important;
		}
		`
	document.body.appendChild(s);
}


//handle shift key
addEventListener("keydown", (event) => { 
	SHIFT = event.shiftKey;
})
addEventListener("keyup", (event) => { 
	SHIFT = event.shiftKey;
})

window.addEventListener('DOMContentLoaded', (event) => {
	updateSpritesheet();
	
	let canvas = document.getElementById('main');
	let canvastop = document.getElementById('top');
	let width = canvas.clientWidth;   //probably 960px
	let height = canvas.clientHeight; //probably 800px
	let ctx = canvas.getContext('2d');
	let ctxtop = canvastop.getContext('2d');




	// ----------------------------------------------------------------------------------------------------------
	//    palette control
	//
	var storedPalette = getCookie("palette");
	//synthesizing more colors here, for more complex visuals
	//quite annoyingly this needs to be both js and css variables
	let [palettecolor1,palettecolor2,palettecolor3,palettecolor4,palettecolor5,palettecolorshadow,palettecolor34,palettecolor45,palettecolor14] = ["#cacaca","#f76700","#4a3553","#000000cc","#3e2239","#666666","#251a29","#1f111c","#656565"];
	if (storedPalette) {
		let c34 = average_two_colors(storedPalette.slice(12,18),storedPalette.slice(18,24));
		let c45 = average_two_colors(storedPalette.slice(18,24),storedPalette.slice(24,30));
		let c14 = average_two_colors(storedPalette.slice(0,6),storedPalette.slice(18,24));
		let ts  = getTextShadow(storedPalette);
		document.documentElement.style.cssText = "--color1: #"+storedPalette.slice(0,6)+
		"; --color2: #"+storedPalette.slice(6,12)+
		"; --color3: #"+storedPalette.slice(12,18)+
		"; --color4: #"+storedPalette.slice(18,24)+
		"cc; --color5: #"+storedPalette.slice(24,30)+
		"; --textshadow: #"+ts+
		"; --color34: #"+c34+
		"; --color45: #"+c45+
		"; --color14: #"+c14+
		";";
		[palettecolor1,palettecolor2,palettecolor3,palettecolor4,palettecolor5,palettecolorshadow,palettecolor34,palettecolor45,palettecolor14] = [storedPalette.slice(0,6),storedPalette.slice(6,12),storedPalette.slice(12,18),storedPalette.slice(18,24),storedPalette.slice(24,30),ts,c34,c45,c14].map(c => "#"+c.toString());
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
	
	//text with a dropshadow. convolution kernel:
	//   t
 	//  sss
	//   s
	//you can pass context to this function if you want, but it defaults to ctx
	//(which is the lower, main context.) Honestly I'm just writing this because
	//I know in my heart that cx=ctx is a stupid thing to type and I should
	//change it.
	function draw_outlined_text(t,x,y,color="white",coloroutline="black",cx=ctx) {
		cx.fillStyle = coloroutline;
		cx.fillText(t,x-1,y+1);
		cx.fillText(t,x+1,y+1);
		cx.fillText(t,x,y+1);
		cx.fillText(t,x,y+2);
		cx.fillStyle = color;
		cx.fillText(t,x,y);
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
	
	//actually a speciallized battle div drawer. txt is title, txt2 is timestamp.
	function drawdivlink(x,y,w,h,txt,txt2,battle,extraclass=""){
		let maindiv = document.getElementById("maindiv");
		let a = document.createElement("a");
		let div = document.createElement("div");
		let divicon = document.createElement("div");
		let smalltime = document.createElement("small");
		let span = document.createElement("span");
		
		let divformat = document.createElement("div");
		let divhost = document.createElement("div");
		
		div.className = "fixed "+extraclass;
		//min height has to be added here to stop things from shrinking on hover
		div.style = "width:"+(w-10)+"px;height:"+(h-5)+"px;min-height:"+(h-5)+"px;left:"+x+"px;top:"+y+"px;";
		
		//icon
		divicon.className = "battleicon botb-icon icons-formats-"+battle.format_tokens[0];
		
		//battle title
		span.textContent = txt.toString();
		//timestamp
		smalltime.textContent = txt2.toString();
		
		divformat.className = "smalldiv smalldivspacer";
		divformat.textContent = battle.format_tokens[0];
		divhost.className = "smalldiv";
		divhost.textContent = battle.hosts_names;
	
		// a
		//  | div
		//  |   | divicon
		//  |   | smalltime
		//  |   | span
		//  |   | divformat
		//  |   | divhost
		
		div.appendChild(divicon);
		div.appendChild(smalltime);
		div.appendChild(span);
		
		div.appendChild(divformat);
		div.appendChild(divhost);
		
		a.href = battle.profileURL;
		a.appendChild(div);
		maindiv.appendChild(a);
	}

	//draws boxes for every battle in a list. old switches the color palette.
	function draw_battle_list(battles_list, old=false) {
		
		//the list needs to be sorted by start time so the inbetween-free-time calculation (at the end)
		//works properly. also means function mutates battles_list.
		battles_list.sort( (a,b) => (a["period_data"][0]["start"] - b["period_data"][0]["start"]) );
		
		let lastet = 0;
		
		for (let i in battles_list) {
	
			//filter non-xhb out
			if (battles_list[i].type != 3) continue;

			//assign class names (different colors)
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
			if (start_days_remaining > 6) continue;
			
			let timestring = clockstring(st.getHours(),st.getMinutes());
			
			if (start_days_remaining != end_days_remaining) {
				//this xhb crosses the day boundry, must be drawn in two parts

				drawdivlink(
					xunit*6*start_days_remaining+xunit,
					yunit+yunit/2*start_decimal_hours_absolute,
					xunit*6-paddingpx, 
					yunit/2*(24 - start_decimal_hours_absolute),
					battles_list[i].title,
					timestring,
					battles_list[i],
					cl);
				
				//this breaks out of the for loop! this battle will not trigger
				//the free time calculation at the bottom, although if it's a
				//week away at 12am, maybe it doesn't matter?
				if (end_days_remaining > 6) continue;
				
				//this is the residual part of the xhb the next day after 12am.
				//it has no name or timestamp so it is visually different from
				//an xhb that starts at 12am. drawdivlink() still draws its
				//format icon.
				drawdivlink(
					xunit*6*end_days_remaining+xunit,
					yunit,
					xunit*6-paddingpx,
					yunit/2*end_decimal_hours_absolute,
					"...",
					"",
					battles_list[i],
					cl);
				
			} else {
				//the standard xhb draw call.
				drawdivlink(
					xunit*6*start_days_remaining+xunit,
					yunit+yunit/2*start_decimal_hours_absolute,
					xunit*6-paddingpx,
					yunit/2*(end_decimal_hours_absolute - start_decimal_hours_absolute),
					battles_list[i].title,
					timestring,
					battles_list[i], cl);
			}
			
			
			//list the free time inbetween the battles
			//  [____________]
			//    free: 30m
			//  [````````````]
			//  ^ my awesome diagram
			if (lastet) {		
				freetimedecimalhours = (st.getTime() - lastet.getTime())/3600000;
				//filter out sub 30 minutes
				if (freetimedecimalhours>.5) {
					let fh = Math.floor(freetimedecimalhours);
					let fm = Math.floor((freetimedecimalhours%1)*60);
					let timestring = fh ? (fh+"h "+fm+"m") : (fm+"m");
					
					//this text should be placed at the midpoint time between the end of the first
					//xhb and the start of the second. we'll just average the two and use the same
					//math we've been using to convert the timestamp into x,y pos.
					let betweentimetimestamp = new Date( (st.getTime() + lastet.getTime())/2 );
					let between_days_remaining = days_from_epoch(betweentimetimestamp.getTime()) - days_from_epoch(now.getTime());
					let between_decimal_hours_absolute = betweentimetimestamp.getHours() + betweentimetimestamp.getMinutes()/60;
					
					ctx.font = fontpx + "px sans-serif";
					ctx.textAlign = "center";
					draw_outlined_text( 
						"free: " + timestring,
						xunit*6*between_days_remaining+xunit*4,
						yunit+yunit/2*between_decimal_hours_absolute+3,
						palettecolor14,
						palettecolorshadow+"55"
					)
				}
			}
			
			lastet = et;
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
		//top left box top shading
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
			//ruler 24 hour grid (skips 0 and 12)
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
			
			//top shading
			ctx.fillStyle = topshadegradient;
			ctx.beginPath();
			ctx.roundRect(xunit*6*i+xunit, 0, xunit*6-paddingpx, yunit-paddingpx, borderradius);
			ctx.fill();
			
			//header day text
			ctx.textAlign = "center";
			ctx.font = "bold " + dayfontpx + "px Verdana";
			let d = new Date(now.getTime() + i*24*3600000);
			draw_outlined_text( 
				parse_day(d.getDay()) + " " + (d.getMonth()+1).toString() + "/" + d.getDate().toString(),
				xunit*6*i + xunit*4 - 3, 
				yunit/2 + 3, 
				palettecolor1, 
				fontoutlinecolor);
			
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
		
		//line dropshadow
		ctxtop.fillStyle = fontoutlinecolor;
		ctxtop.fillRect(xunit, yunit+yunit/2*current_decimal_hours, xunit*6-paddingpx, linethickness+1);
		
		//circle dropshadow
		ctxtop.beginPath();
		ctxtop.arc(xunit, yunit+yunit/2*current_decimal_hours+1, 5, 0, 6.28);
		ctxtop.fill();		

		
		//line
		ctxtop.fillStyle = palettecolor1;
		ctxtop.fillRect(xunit, yunit+yunit/2*current_decimal_hours, xunit*6-paddingpx, linethickness);
		
		//big 5px circle
		ctxtop.beginPath();
		ctxtop.arc(xunit, yunit+yunit/2*current_decimal_hours, 5, 0, 6.28);
		ctxtop.fill();		
		
		//little 3px circle
		ctxtop.fillStyle = palettecolor2;
		ctxtop.beginPath();
		ctxtop.arc(xunit, yunit+yunit/2*current_decimal_hours, 3, 0, 6.28);
		ctxtop.fill();
	}

	let CROSSHAIRFRAME = 0;
	function draw_mouse_crosshairs(x,y) {
		
		if (x<xunit) return;
		if (y<yunit) return;
		
		//snap x left to day boundary
		let snappedx = Math.floor((x-xunit)/(xunit*6))*xunit*6+xunit;
		
		//snap y to 15 minutes
		//one hour is yunit/2 so 15 minutes is yunit/8
		let snappedy = y;
		if (SHIFT) snappedy = Math.round((y-yunit)/(yunit/8))*(yunit/8)+yunit;
		
		ctxtop.fillStyle = palettecolor2;
		ctxtop.strokeStyle = palettecolor2;
		
		//line across the day the mouse is over
		ctxtop.fillRect( snappedx,snappedy,xunit*6-paddingpx,linethickness );
		//line that marks the ruler on the left
		ctxtop.fillRect( 0,snappedy,xunit-paddingpx,linethickness );
		
		//ctxtop.fillRect( x,y-10,linethickness,20 );
		
		//endless fun was had
		
		ctxtop.beginPath();
		ctxtop.arc(x,y, 6, CROSSHAIRFRAME*.03, CROSSHAIRFRAME*.03+5);
		
		let xsize = 8;
		let s = Math.sin(CROSSHAIRFRAME*.03)*xsize;
		let c = Math.cos(CROSSHAIRFRAME*.03)*xsize;
		ctxtop.moveTo(x+s,y+c);
		ctxtop.lineTo(x-s,y-c);
		ctxtop.moveTo(x-s,y+c);
		ctxtop.lineTo(x+s,y-c);
		ctxtop.stroke();
		
		CROSSHAIRFRAME++;
		CROSSHAIRFRAME%=419;
	}
	
	
	
	
	
	

	
	
	
	//the full draw cycle, which runs every 2 minutes
	function draw() {
		
		let now = new Date();
		let clocks = "[" + clockstring(now.getHours(),now.getMinutes()) + "] ";
		
		textdisplay(clocks + "0/2 Refreshing... ");
		
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
			textdisplay(clocks + "2/2 Loaded!");
			if (first_response) {
				textdisplay(clocks + "1/2 Loaded future battles...");
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
			textdisplay(clocks + "2/2  Loaded!");
			if (first_response) {
				textdisplay(clocks + "1/2 Loaded past battles...");
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
	
	//if we get the graphix up as soon as possible it looks better, so extra half-draw call 
	//before the http requests come in
	
	//the divs that represent battles are sandwiched
	//between two canvases, the bottom is the background with the days, hour-ruler, and grid,
	//the top one has the mouse crosshairs and the current time marker-pin-thing.
	//clear() draws the bottom canvas, which is called right after the http requests return,
	//and then right after, the battle divs are drawn. then the topcanvas is drawn, although
	//moving the mouse over the agenda also redraws the topcanvas.
	clear();
	draw_current_time_marker();
	
	draw();
	
	setInterval(draw,120000);
	
	//now set up mouse handling functions for the text display.
	document.getElementById("maindiv").addEventListener('mousemove', (event) => {
		let now = new Date();
		
		let m = document.getElementById("maindiv").getBoundingClientRect();
		let mx = event.x - m.x;
		let my = event.y - m.y;
		
		//in decimal hours from 12AM the first listed day
		//rounds to nearest .25 when shift is held
		//this needs to be applied to the mouse coordinates directly for parity
		//with the draw_mouse_crosshairs() code, i.e. so they always line up.
		let hoursroundifshift =                   Math.max(my - yunit,0)/(yunit/2);
		if (SHIFT) hoursroundifshift = Math.round(Math.max(my - yunit,0)/(yunit/8))/4;
		
		let mtime = hoursroundifshift + 24 * Math.floor( Math.max(mx-xunit,0)/(xunit*6));
		//use a Date() to convert timestamp to day name in user timezone
		let mtimedaytextd = new Date(now.getTime() + Math.floor(mtime/24)*24*3600000);
		let mtimedaytext = parse_day(mtimedaytextd.getDay()) + " " + mtimedaytextd.getDate();
		
		let minutes = Math.floor( (mtime%1)*60 );
		let clocks = clockstring( Math.floor(mtime%24), minutes.toString() );
		let mtimetext = mtimedaytext + ", " + clocks;
		
		let nowdecimalhours = now.getHours() + now.getMinutes()/60;
		let mtimerelative = mtime - nowdecimalhours;
		
		//negative numbers need to be ceilinged or else -1 seconds gets floored to -1 days, -1 hours, -1 minutes.
		let rminutes = Math.floor((mtimerelative%1)*60);
		let days =        (mtimerelative<0) ? Math.ceil(mtimerelative/24)     : Math.floor(mtimerelative/24);
		let hours =    (mtimerelative%24<0) ? Math.ceil(mtimerelative%24)     : Math.floor(mtimerelative%24);
		let mtimerelativetext = days + "d " + hours + "h " + rminutes + "m";
		
		textdisplay("Mouse position: " + mtimetext + " / in " + mtimerelativetext);
		
		ctxtop.clearRect(0, 0, width, height);
		draw_current_time_marker();
		draw_mouse_crosshairs(mx,my);
	});
	
	
});



