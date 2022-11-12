// jspdf - break up into a4 pages for printing?

refreshlist({'showmsg':false});

window.jsPDF = window.jspdf.jsPDF;

var rotaselected = '';
var editingrotadata = {'oldname':'','name':'','by':'','workers':[],'shifts':{},'table':[]};

const checkedradio = '<img class="checkimg" src="/assets/img/checked.svg", alt="checked">';
const uncheckedradio = '<img class="checkimg" src="/assets/img/unchecked.svg", alt="unchecked">';

const addshift = '<img src="/assets/img/addrota.svg" alt="add">';
const editshift = '<img src="/assets/img/editrota.svg" alt="edit">';

function post(api,bodyobj,onresponse){
	fetch(api, {
		method: "POST",
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(bodyobj)
	}).then(function (response) {
		return response.text();
	}).then(function (data) {
		onresponse(JSON.parse(data));
	});
}

function get(api,search,onresponse){
	if (search!='') search = '/'+search;
	fetch(api+search, {
		method: "GET",
		headers: { 'Content-Type': 'application/json' },
	}).then(function (response) {
		return response.text();
	}).then(function (data) {
		onresponse(JSON.parse(data));
	});
}

function responseStandard(resobj){
	if (resobj['success']){
		statusmsg(resobj['msg']);
		rebuildrotalist(resobj['list']);
	} else {
		popup('Oops ! [erreur]',resobj['error']);
	}
}

function popup(title,txt){
	$('body').addClass('popup-active');
	$('.popup .title').text(title);
	$('.popup .txt').text(txt);
}

function statusmsg(txt){
	$('#statusmsg p').html(txt);
	$('body').addClass('statusmsg').delay(2000).queue(function(){
		$(this).removeClass("statusmsg").dequeue().delay(500);
	});
}

function rebuildrotalist(rotaobjs){
	var table = $('<table>');
	table.append('<thead></thead><tbody></tbody>');
	table.find('thead').append('<tr><th class="selectcol">Select</th><th class="namecol">Nom de la liste</th><th class="bycol">Cr&eacute;&eacute; par</th><th class="datecol">Date</th><th class="workercol">N&ordm; soignants</th></tr>');
	for (var i=0; i<rotaobjs.length; i+=1){
		var row = $('<tr>');
		for (var [k,el] of Object.entries(rotaobjs[i])){
			if (k=='name'){
				if (rotaselected!='' && el==rotaselected) {
					row.addClass('selected');
					row.append('<td class="checkclick">'+checkedradio+'</td>');
				}
				else row.append('<td class="checkclick">'+uncheckedradio+'</td>');
			}
			row.append('<td>'+el+'</td>');

		}
		table.find('tbody').append(row);
	}
	$('#rotalistviewer').empty();
	$('#rotalistviewer').append(table);
	
	$('.checkclick').click(function(){
		selectrota($(this).parent());
	});
}

function selectrota(row){
	$('.selected .checkclick').html(uncheckedradio);
	$('.selected').removeClass('selected');
	row.addClass('selected');
	$('body').addClass('rotaselected');
	$('.selected .checkclick').html(checkedradio);
	rotaselected = $('.selected td:first-child + td').text();
	viewcurrentrota();
}

function selectlastrota(){
	selectrota($('#rotalistviewer tbody tr:last-child'));
}

function clearrotaselect(){
	rotaselected = '';
	$('body').removeClass('rotaselected');
	$('.selected .checkclick').html(uncheckedradio);
	$('.selected').removeClass('selected');
	$('#homepage .rotaviewercontainer').empty();
}

function refreshlist(param){
	get('/listrotas','',function (resobj){
		if (resobj['success']){
			rebuildrotalist(resobj['list']);
			if (param['showmsg']) statusmsg(resobj['msg']);
		} else {
			popup('Oops',resobj['error']);
		}
	});
}

$('#refresh').click(function(){
	refreshlist({'showmsg':true});
	clearrotaselect();
});

var silselected = [];
var silrowheight = 2;
for (var i=0; i<64; i+=1) silselected.push(0);
function checksilclick(){
	$('.sil').click(function(){
		if ($(this).hasClass('silblank')) {
			$(this).removeClass('silblank').addClass('silchosen');
			const col = $(this).attr("class").match(/\d+/)[0];
			silselected[col]+=1;
			if (silselected[col]>=silrowheight) {
				silrowheight = silselected[col]+1;
				const newrow = $('<tr>')
				for(let c = 0; c < 64; c+=1){
					newrow.append('<td class="sil silblank silcol-'+c+'"><img class="siltick" src="/assets/img/tick.svg" alt="tick"></td>');
				}
				$('#addrotapage #silhouetterota tbody tr:last').before(newrow);
				$('.sil').off('click');
				checksilclick();
			}
		}
		else if ($(this).hasClass('silchosen')) {
			$(this).removeClass('silchosen').addClass('silblank');
			const col = $(this).attr("class").match(/\d+/)[0];
			silselected[col]-=1;
		}
	});
}
$('#addrota').click(function(){
	get('/silhouetterota','',function (resobj){
		if (resobj['success']){
			$('#addrotapage #silhouetterota').html(resobj['html']);
			statusmsg(resobj['msg']);
			updatePageState('addrotapage');
			clearrotaselect();
			dragrota();
			silselected = [];
			silrowheight = 2;
			for (var i=0; i<64; i+=1) silselected.push(0);
			checksilclick();
		} else {
			popup('Oops',resobj['error']);
		}
	});
});

var genworkerlist = [];
function checkdelworkername(index){
	$('#addworkerstable .worker-'+index.toString()).click(function(){
		genworkerlist.splice(index, 1);
		$('#addworkerstable thead tr th').each(function(i){
			if (i>index){
				$(this).removeClass();
				$(this).addClass('worker-'+(i-1).toString());
			}
		});
		$(this).remove();
	});
}
$('#addrotapage .add-button').click(function(){
	const inputworkername = $('#addworker.input-container input').val();
	if (inputworkername!='' && !genworkerlist.includes(inputworkername)){
		$('#addworkerstable thead tr').append('<th class="worker-'+genworkerlist.length.toString()+'">'+inputworkername+'<img class="workername-del" src="/assets/img/delrota.svg"/></th>');
		checkdelworkername(genworkerlist.length);
		genworkerlist.push(inputworkername);
		$('#addworker.input-container input').val('');
	} else if (inputworkername==''){
		popup('Oops', 'Workers name field cannot be left blank');
	} else if (genworkerlist.includes(inputworkername)){
		popup('Oops', 'You\'ve already entered that name – please enter a different one.');
	}
});
$('#generaterota').click(function(){
	const inputname = $('#inputname.input-container input').val();
	const inputby = $('#inputby.input-container input').val();
	if (inputname != '' && inputby!='' && genworkerlist.length>0){
		var shifts = {};
		shifts[genworkerlist[0]] = [
			{"d":0,"s":6,"t":10},
			{"d":1,"s":22,"t":8},
			{"d":5,"s":20,"t":8}
		];
		shifts[genworkerlist[1]] = [
			{"d":0,"s":16,"t":20},
			{"d":2,"s":16,"t":20},
			{"d":3,"s":22,"t":8},
			{"d":6,"s":14,"t":20},
		];
		shifts[genworkerlist[2]] = [
			{"d":0,"s":16,"t":20},
			{"d":2,"s":16,"t":20},
			{"d":5,"s":6,"t":14},
			{"d":6,"s":6,"t":12},
		];
		shifts[genworkerlist[3]] = [
			{"d":0,"s":20,"t":8},
			{"d":4,"s":16,"t":20},
			{"d":6,"s":8,"t":14},
		];
		shifts[genworkerlist[4]] = [
			{"d":1,"s":6,"t":10},
			{"d":3,"s":6,"t":10},
			{"d":4,"s":6,"t":10},
			{"d":5,"s":8,"t":20},
		];
		shifts[genworkerlist[5]] = [
			{"d":2,"s":6,"t":10},
			{"d":3,"s":16,"t":20},
			{"d":4,"s":16,"t":20},
			{"d":5,"s":14,"t":20},
			{"d":6,"s":20,"t":8},
		];
		shifts[genworkerlist[6]] = [
			{"d":1,"s":16,"t":20},
			{"d":2,"s":20,"t":8},
			{"d":6,"s":12,"t":20},
		];
		shifts[genworkerlist[7]] = [
			{"d":1,"s":16,"t":22},
			{"d":3,"s":16,"t":22},
			{"d":4,"s":20,"t":8},
		];
		const bodyobj = {
			"name": inputname,
			"by": inputby,
			"workers":genworkerlist,
			"shifts":shifts,
		};
		post('/addrota',bodyobj,function (resobj){
			responseStandard(resobj);
			$('#inputname.input-container input').val('');
			$('#addworkerstable thead tr').empty();
			genworkerlist = [];
			selectlastrota();
			updatePageState('homepage');
		});
	} else if (inputname == '') {
		popup('Oops', 'Name of rota field cannot be left blank.');
	} else if (inputby == '') {
		popup('Oops', 'Created by field cannot be left blank.');
	} else if (genworkerlist.length==0) {
		popup('Oops', 'Please add at least one worker!');
	}
});


$('#duprota').click(function(){
	if ($('body').hasClass('rotaselected') && rotaselected!=''){
		const bodyobj = {'name':rotaselected,'newname':rotaselected+' copy'};
		post('/duprota',bodyobj,function (resobj){
			responseStandard(resobj);
			if (resobj['success']){
				selectlastrota();
			}
		});
	}
});

$('#delrota').click(function(){
	if ($('body').hasClass('rotaselected') && rotaselected!=''){
		const bodyobj = {'name':rotaselected};
		post('/delrota',bodyobj,function (resobj){
			responseStandard(resobj);
		});
		clearrotaselect();
	}
});

// $('#delallrota').click(function(){
// 	if ($('body').hasClass('rotaselected') && rotaselected!=''){
// 		const bodyobj = {};
// 		post('/delallrota',bodyobj,function (resobj){
// 			responseStandard(resobj);
// 		});
// 		clearrotaselect();
// 	}
// });

$('#editrota').click(function(){
	get('/editfetchrota',rotaselected,function (resobj){
		if (resobj['success']){
			editingrotadata = {
				'oldname':resobj['name'],
				'name':resobj['name'],
				'by':resobj['by'],
				'workers':resobj['workers'],
				'shifts':resobj['shifts'],
				'table':resobj['table']
			};
			console.log(resobj['table']);
			$('#editrotapage #inputeditname input').val(editingrotadata['name']);
			$('#editrotapage #inputeditby input').val(editingrotadata['by']);
			buildeditworkerstable();
			buildeditrotatable();
			checkworkerrotaclick();
			dragrota();
			statusmsg(resobj['msg']);
			updatePageState('editrotapage');
		} else {
			popup('Oops',resobj['error']);
		}
	});
});

function buildeditworkerstable(){
	$('#editworkerstable thead tr').empty();
	for (var i=0; i<editingrotadata['workers'].length; i+=1){
		$('#editworkerstable thead tr').append('<th class="worker-'+i+'"><input value="'+editingrotadata['workers'][i]+'"></th>');
	}
}

function buildeditrotatable(){
	$('#editrotapage .rotaviewercontainer').empty();
	$('#editrotapage .rotaviewercontainer').append('<div class="rotaviewer"></div>');
	$('#editrotapage .rotaviewer').html($('#homepage .rotaviewer').html());
	$('#editrotapage .rotaviewer .worker').addClass('noshift');
	$('#editrotapage .rotaviewer td[class^="worker-"]').removeClass('noshift').addClass('shift');
	$('#editrotapage .noshift').html(addshift);
	$('#editrotapage .shift').html(editshift);
}

function checkworkerrotaclick(){
	$('#editrotapage .worker').click(function(){
		$('.choose-workers').remove();
		var dropdownstr = '<div class="choose-workers">';
		for (var i=0; i<editingrotadata['workers'].length; i+=1){
			dropdownstr += '<div class="worker-'+i+' choose-worker"></div>';
		}
		dropdownstr += '<div class="choose-worker"><img src="/assets/img/delrota.svg" alt="delete"></div>';
		dropdownstr += '</div>'
		$(this).html(dropdownstr);
		const cellclicked = this;
		$('#editrotapage .choose-worker').click(function(){
			const workeridmatches = $(this).attr("class").match(/worker-\d+/);
			var workeraction = '';
			if (workeridmatches!=null) workeraction = workeridmatches[0];
			console.log(workeraction)
			if (workeraction!='' && $(cellclicked).hasClass('noshift')) {
				$(cellclicked).removeClass('noshift').addClass('shift');
				// const col = $(this).attr("class").match(/\d+/)[0];
				$(cellclicked).addClass(workeraction);
				$(cellclicked).html(editshift);
			}
			else if ($(cellclicked).hasClass('shift')) {
				$(cellclicked).removeClass('shift').addClass('noshift');
				$(cellclicked).removeClass(function (index, className) {
					return (className.match (/(^|\s)worker-\S+/g) || []).join(' ');
				});
				$(cellclicked).addClass(workeraction);
				$(cellclicked).html(addshift);
			}
			$('.choose-workers').remove();
			$('#editrotapage .choose-worker').off('click');
			$('#editrotapage .worker').off('click');
			// checkworkerrotaclick();
		});
		
	});
}

$('#saveeditrota').click(function(){
	editingrotadata['name'] = $('#editrotapage #inputeditname input').val();
	editingrotadata['by'] = $('#editrotapage #inputeditby input').val();
	var editedworkers = [];
	var anyworkernamesempty = false;
	for (var i=0; i<editingrotadata['workers'].length; i+=1){
		const wname = $('#editworkerstable .worker-'+i+' input').val();
		if (wname=='') {
			anyworkernamesempty = true;
			break;
		} else editedworkers.push(wname);
	}
	if (editingrotadata['name']!='' && editingrotadata['by']!='' && !anyworkernamesempty){
		const validshiftdata = {};
		for (var i=0; i<editingrotadata['workers'].length; i+=1){
			validshiftdata[editedworkers[i]] = editingrotadata['shifts'][editingrotadata['workers'][i]];
		}
		const bodyobj = {
			'oldname': editingrotadata['oldname'],
			'name': editingrotadata['name'],
			'by': editingrotadata['by'],
			'workers': editedworkers,
			'shifts': validshiftdata,
		}
		post('/editrota',bodyobj,function (resobj){
			responseStandard(resobj);
			// $('#inputname.input-container input').val('');
			// $('#addworkerstable thead tr').empty();
			selectlastrota();
			editingrotadata = {'oldname':'','name':'','by':'','workers':[],'shifts':{}};
			editedworkers = [];
			anyworkernamesempty = false;
			updatePageState('homepage');
		});
	} else if (editingrotadata['name']==''){
		popup('Oops', 'Name of rota field cannot be left blank.');
	} else if (editingrotadata['by']==''){
		popup('Oops', 'Created by field cannot be left blank.');
	} else if (anyworkernamesempty){
		popup('Oops', 'You left one of the workers names blank.');
	}
});

function dragrota(){
	var clicked = false;
	var clickX;
	var diffX = 0;
	function momentumend(){
		clicked = false;
		$('.rotaviewer').removeClass('grabbing');
		const currentl = $('.rotaviewer').scrollLeft();
		$(".rotaviewer").stop();
		$('.rotaviewer').animate(
			{scrollLeft : currentl+5*diffX},
			500,
			'easeOutQuad');
	}
	$('.rotaviewer td, .rotaviewer th').on('mousedown',function(e) {
		if (!$(this).hasClass('silblank') && !$(this).hasClass('silchosen') && !$(this).hasClass('noshift') && !$(this).hasClass('shift')){
			$(".rotaviewer").stop();
			clicked = true;
			$('.rotaviewer').addClass('grabbing');
			clickX = e.pageX;
		}
	});
	$('.rotaviewer').on({
		'mousemove': function(e) {
			if (clicked) updateScrollPos(e);
			clickX = e.pageX;
		},
		'mouseup': function() {
			if (clicked) momentumend();
		},
		'mouseleave': function() {
			if (clicked) momentumend();
		}
	});
	var updateScrollPos = function(e) {
		diffX = clickX - e.pageX;
		$('.rotaviewer').scrollLeft($('.rotaviewer').scrollLeft() + diffX);
	}
}

function viewcurrentrota(){
	get('/viewrota',rotaselected,function (resobj){
		if (resobj['success']){
			$('#homepage .rotaviewercontainer').empty();
			$('#homepage .rotaviewercontainer').append(resobj['html']);
			buildworkerhourstable(resobj['workertimes']);
			statusmsg(resobj['msg']);
			dragrota();
		} else {
			popup('Oops',resobj['error']);
		}
	});
}

$('#fullscreenrota').click(function(){
	if ($('body').hasClass('rotaselected') && rotaselected!=''){
		$('#fullscreenrotapage .rotaviewercontainer').html($('#homepage .rotaviewercontainer').html());
		dragrota();
		updatePageState('fullscreenrotapage');
		openFullscreen();
	}
});

function buildworkerhourstable(rotaobjs){
	var workerhoursviewer = $('<div>').addClass('workerhoursviewer');
	var table = $('<table>').addClass('workerhourstable');
	table.append('<thead></thead><tbody></tbody>');
	var headrow = $('<tr>');
	var bodyrow = $('<tr>');
	headrow.append('<th>Worker</th>');
	bodyrow.append('<td>Hours</td>');
	var id = 0;
	var total = 0;
	for (var [name,hours] of Object.entries(rotaobjs)){
		headrow.append('<th class="worker-'+id+'">'+name+'</th>');
		bodyrow.append('<td>'+hours+'h</td>');
		total += hours;
		id+=1;
	}
	headrow.append('<th>Total</th>');
	bodyrow.append('<td>'+total+'</td>');
	table.find('thead').append(headrow);
	table.find('tbody').append(bodyrow);
	workerhoursviewer.append(table);
	$('#homepage .rotaviewercontainer').append(workerhoursviewer);
}

$('#savepdf').click(function(){
	if ($('body').hasClass('rotaselected') && rotaselected!=''){
		const doc = new jsPDF('l', 'mm', [1200, 150]);
		doc.addFont("/assets/fonts/OpenSans-Regular.ttf", "OpenSans", "normal");
		doc.setFont("OpenSans","normal");
		doc.autoTable({
			html: '.rotatable',
			useCss: true,
			theme: 'grid',
			styles: {
				font: "OpenSans",
			},
			headStyles: {
				lineWidth: 0.25,
				lineColor: [220, 220, 220],
				minCellHeight: 10,
			},
			bodyStyles: {
				lineWidth: 0.25,
				lineColor: [220, 220, 220],
				minCellHeight: 10,
			}
		});
		doc.autoTable({
			startY: doc.lastAutoTable.finalY + 30,
			tableWidth: 400,
			html: '#homepage .workerhourstable',
			useCss: true,
			theme: 'grid',
			styles: {
				font: "OpenSans",
			},
			headStyles: {
				lineWidth: 0.25,
				lineColor: [220, 220, 220],
				minCellHeight: 10,
			},
			bodyStyles: {
				lineWidth: 0.25,
				lineColor: [220, 220, 220],
				minCellHeight: 10,
			}
		});
		doc.save(rotaselected + '.pdf');
	}
});

$('.popupcross').click(function(){
  $('.popup .title').empty();
  $('.popup .txt').empty();
  $('body').removeClass('popup-active');
});


$('.back-button').click(function(){
	updatePageState('homepage');
	editingrotadata = {'oldname':'','name':'','by':'','workers':[],'shifts':{}};
});

function openFullscreen() {
	document.documentElement.requestFullScreen ? document.documentElement.requestFullScreen() : document.documentElement.mozRequestFullScreen ? document.documentElement.mozRequestFullScreen() : document.documentElement.webkitRequestFullScreen && document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
}

function updatePageState(state){
	$('#outercontent').removeClass();
	$('#outercontent').addClass(state);
}