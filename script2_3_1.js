var p1;
var p2;

var _repeatCount = 0;
var _repeatMax = 1;
var _currentPlaySeq = 0;
var _relayMode = false;
var _playerName = "player1";
var _relayFinishCount = 0;
var _reTryCount = 0;
var _reTryCount2 = 0;
var _observerInterval;
var _startInterval;

function onYouTubeIframeAPIReady() {
	if(typeof q == "undefined"){	// TODO deploy
		$("#mainContents").hide();		
		$("#mainContents2").show();
		return;
	}
	$("#qqqq").html(q + "&nbsp;&nbsp;(" + list.length + ")");
	init1();
	$("#parentIframe1").css("z-index", "10");
	$("#parentIframe2").css("z-index", "1");
}
var makePlayer = function(name, iframeId, videoId, info){
	var store = info;
	store.initFlag = true;
	store.playMode = 9999;
	store.startFlag = false;
	store.cueFlag = false;
	store.isAblePlayer = true;
	store.tempInterval = null;
	store.time_update_interval = null;
	store.transaction = false;
	store.ready = false;
	store.isplay = false;
	var player = new YT.Player(iframeId, {
        width: 550,
        height: 500,
        videoId: videoId,
        playerVars: {
            playlist: ''
            ,controls: 1
            ,cc_load_policy: 0
        },
        events: {
            onReady: onPlayerReady
            , onPlaybackQualityChange : onPlaybackQualityChange
            , onStateChange : onStateChange
            , onError : onError
        }
    });
	
	function onPlaybackQualityChange(){}
	function onError(){}
	function onPlayerReady(){
		player.playVideo();
	}
	function onStateChange(event){
		store.playMode = event.data;
		var state = "undefiend";
	    switch (event.data) {
	        case YT.PlayerState.UNSTARTED:	//-1
	            state = "unstarted";
	            break;
	        case YT.PlayerState.ENDED:		//0
	            state = "ended";
	            clearInterval(store.time_update_interval);
//	            console.warn('video ended --> togglePlayerFn call');
	            togglePlayerFn();
	            break;
	        case YT.PlayerState.PLAYING:	//1
	            state = "playing";
	            if(store.initFlag){
	            	player.pauseVideo();
	            	player.seekTo(store.startTime);
	            	store.initFlag = false;
	            	store.startFlag = true;
	            	return;
	            }
	            if(store.transaction){
//	            	console.log(name + " is ready");
	            	player.pauseVideo();	// 대기
	            	store.transaction = false;
	            	store.ready = true;
	            	return;
	            }
	            if(!store.isplay){	// unstarted, buffering 하다가 갑자기 play가 되는 경우 방지, 광고 로드 실패가 된 video인 경우, 갑자기 play가 된다-_-;
//	            	console.warn(name + " play block.");
	            	player.pauseVideo();
	            	// 두번이상 발생할 수 있으므로 flag toggle은 하지 않는다. 다른곳에서 해줌.
	            	
	            	if(store.endTime != 0){
	            		store.endTime = store.endTime + 2;	// margin	
	            	}
	            	return;
	            }
	            
	            /**
	             * 화면상 실제 재생인경우
	             */
//	            console.log(name + " real playing..");
	    	    clearInterval(store.time_update_interval);
	    	    store.time_update_interval = setInterval(function () {
	    	    	updateRepeat();
	    	    }, 500);
	    	    
	            if(store.endTime == 0){
	            	store.endTime = player.getDuration();
	            	if(store.endTime - store.startTime > 7){
	            		store.endTime = store.startTime + 7;
	            	}
	            }
	            $('#endTime').val(store.endTime);
	            $('#startTimeFormat').html(formatTime(store.startTime));
	            
	            displayControl(store);
	            break;
	        case YT.PlayerState.PAUSED:		//2
	            state = "paused";
	            clearInterval(store.time_update_interval);
	            break;
	        case YT.PlayerState.BUFFERING:	//3
	            state = "buffering";
	            break;
	        case YT.PlayerState.CUED:		//5
	            state = "video cued";
	            break;
	        default:
	            state = "unknown (" + event.data + ")";
	    }
	    store.playType = state;
//	    console.log(name + ", p1:" + p1.store.playType + ", p2:" + p2.store.playType);
	}
	
	function updateRepeat(){
		$("#currentTimeFormat").html(formatTime(player.getCurrentTime()) + "(" + parseInt(player.getCurrentTime() - store.endTime, 10) + ")");
		if(store.startFlag && store.playMode == 1 && player.getCurrentTime() < store.startTime){
//			console.log(name + " getCurrentTime() < store.startTime");
			player.seekTo(store.startTime);
		}			
		if(store.startFlag && store.playMode == 1 && player.getCurrentTime() > (store.endTime)){	// margin:2
//			console.log(name + " getCurrentTime() > store.endTime");

			togglePlayerFn();
		}
	}
	
	function togglePlayerFn(){
		_repeatCount++;
		if(!(_relayMode && _repeatCount >= _repeatMax)){
			player.seekTo(store.startTime);
		}else if(_relayMode && _repeatCount >= _repeatMax){
			_repeatCount = 0;
			_reTryCount = 0;
			$("#retry").hide();
			
			// 현재 위치에 다다음 video 배치하기
			var obj = $("#video" + _currentPlaySeq).next().next();
			if(obj.length == 1){
				store.startTime = Number(obj.attr("startTime"));
				store.endTime = Number(obj.attr("endTime"));
				store.sentence = obj.attr("sentence");
				store.seq = Number(obj.attr("seq"));
				store.videoId = obj.attr("videoId");
//				console.log(name + " call next ready");
				
				player.pauseVideo();
				store.transaction = true;
				store.isplay = false;
				player.loadVideoById(store.videoId, store.startTime);						//STEP1
			}else{
//				console.log(name + " ->> 다다음 비디오 없음.");
				player.pauseVideo();
				store.transaction = true;
				store.isplay = false;
				store.isAblePlayer = false;
				
				if(++_relayFinishCount == 2){
					// 두개 모두 종료했으므로 relay는 종료됨.
//					console.warn("relay finish.");
					_relayFinishCount = 0;
					_currentPlaySeq = 0;
					relayCallbackFn();	// 처음부터 시작
					return;	// 밑에 실행되면 안됨.
				}
			}
			
			// 다른 player로 넘기기
			if(name == "player1"){
				if(p2.store.isAblePlayer){
					_playerName = "player2";
					
					// 꼭 playing이 아니더라도, 전환을 해주어서, 다 로딩되지 못한 동영상인 경우 사용자가 직접 실행하도록 함.
	            	$("#parentIframe1").css("z-index", "1");
	            	$("#parentIframe2").css("z-index", "10");
	            	_currentPlaySeq = Number($("#video" + _currentPlaySeq).next().attr("seq"));
	            	displayControl(p2.store);
	            	
					if(p2.store.playMode == YT.PlayerState.PAUSED && p2.store.ready){	// cue -> pause 준비가 되면, 작동하기
//						console.warn("player1 --> player2");
						p2.store.isplay = true;
						p2.player.playVideo();
						p2.store.ready = false;
					}else{
//						console.warn("player1 --> player2 fail.");
						
						clearInterval(p2.store.tempInterval);
						p2.store.tempInterval = setInterval(function () {
							if(_reTryCount > 3){
								//3초후 player 전환(동영상 소유자가 다른 웹사이트에서 재생할 수 없도록 설정한 경우)
//								console.warn("player1 <-- player2 플레이 재생 불가. 전환");
								clearInterval(p2.store.tempInterval);
								_repeatCount = 9999;
								p2.togglePlayerFn();	// p2가 재생종료되어서 player change로 유도하기 위해
							}
							
//							console.warn("player1 --> player2 RE TRY : " + p1.store.playMode);
							if(p2.store.playMode == YT.PlayerState.PAUSED && p2.store.ready){
//								console.warn("player1 --> player2 RE TRY SUCCESS");
								p2.store.isplay = true;
								p2.player.playVideo();
								p2.store.ready = false;
								$("#retry").hide();
								clearInterval(p2.store.tempInterval);
							}else{
								$("#retry").html("retry: " +_reTryCount++ + "");
								$("#retry").show();
							}
						}, 1000);						
					}
//					console.warn("seq:" + _currentPlaySeq +", p:" + _playerName);
				}else{
//					console.log("player2 is not able");
					_relayMode = false;
				}
			}else if(name == "player2"){
				if(p1.store.isAblePlayer){
					_playerName = "player1";
					
					$("#parentIframe1").css("z-index", "10");
					$("#parentIframe2").css("z-index", "1");
					_currentPlaySeq = Number($("#video" + _currentPlaySeq).next().attr("seq"));
					displayControl(p1.store);
					
					if(p1.store.playMode == YT.PlayerState.PAUSED && p1.store.ready){	// pause 준비가 되면, 작동하기
//						console.warn("player1 <-- player2");
						p1.store.isplay = true;
						p1.player.playVideo();
						p1.store.ready = false;
					}else{
//						console.warn("player1 <-- player2 fail.");
						
						clearInterval(p1.store.tempInterval);
						p1.store.tempInterval = setInterval(function () {
							if(_reTryCount > 3){
								//3초후 player 전환(동영상 소유자가 다른 웹사이트에서 재생할 수 없도록 설정한 경우)
//								console.warn("player1 --> player2 플레이 재생 불가. 전환");
								clearInterval(p1.store.tempInterval);
								_repeatCount = 9999;
								p1.togglePlayerFn();
							}
							
//							console.warn("player1 <-- player2 RE TRY : " + p1.store.playMode);
							if(p1.store.playMode == YT.PlayerState.PAUSED && p1.store.ready){
//								console.warn("player1 <-- player2 RE TRY SUCCESS");
								p1.store.isplay = true;
								p1.player.playVideo();
								p1.store.ready = false;
								$("#retry").hide();
								clearInterval(p1.store.tempInterval);
							}else{
								$("#retry").html("retry: " +_reTryCount++ + "");
								$("#retry").show();
							}
						}, 1000);						
					}
//					console.warn("seq:" + _currentPlaySeq +", p:" + _playerName);
				}else{
//					console.log("player1 is not able");
					_relayMode = false;
				}					
			}
		}		
	}
	
	return {player:player, store:store, togglePlayerFn:togglePlayerFn};
}

function init1(){
	var source = $("#player_template").html(); 
	var template = Handlebars.compile(source);
	
//	console.log("list.length:" + list.length);
	
	// TODO suffle	deploy
	list.sort(function() {
	  return .5 - Math.random();
	});
	for(var i = 0 ; i<list.length; i++){
//	for(var i = 0 ; i<4 ; i++){
		list[i].seq = i;
		
    	if(list[i].endTime != 0){
    		list[i].endTime = list[i].endTime + 3;	// margin	
    	}
    	
		if(i == 0){
			var store = {}
			store.startTime = Number(list[i].startTime);
			store.endTime = Number(list[i].endTime2);
			store.sentence = list[i].sentence;
			store.seq = Number(list[i].seq);
			store.videoId = list[i].videoId;
			p1 = makePlayer("player1", "youtubeIframe1", list[i].videoId, store);			
			p1.store.isplay = true;
		}
		if(i == 1){
			var store = {}
			store.startTime = Number(list[i].startTime);
			store.endTime = Number(list[i].endTime2);
			store.sentence = list[i].sentence;
			store.seq = Number(list[i].seq);
			store.videoId = list[i].videoId;
			p2 = makePlayer("player2", "youtubeIframe2", list[i].videoId, store);
		}
		
		var html = template(list[i]);
		$("#mainDiv").append(html);
		
		// API TODO deploy
		$(".videoClass[seq=" + i + "]").attr("img", list[i].img);
		$(".videoClass[seq=" + i + "] img").attr("src", list[i].img);
	}
}
function clickVideo(obj){
	_repeatCount = 0;
	_relayMode = false;
	
	$(".videoClass").css("background-color", "white");
	$(obj).css("background-color", "orange");
	
//	console.warn("seq:" + _currentPlaySeq +", p:" + _playerName);
	_currentPlaySeq = Number($(obj).attr("seq")); 
	
	setPlayerCommon($(obj), false);
}
function relayCallbackFn(){
//	console.warn("seq:" + _currentPlaySeq +", p:" + _playerName);
	var obj = $("#video" + _currentPlaySeq);	// 현재 seq부터 다시 시작
	if(obj.length != 0){
		// 초기화
		_relayMode = true;
		_repeatCount = 0;
		
		setPlayerCommon(obj, true);
	}
}

function setPlayerCommon(jObj, isSecond){
	// 초기화
	clearInterval(p1.store.tempInterval);			// interval을 먼저 초기화해야 변수가 혹시나 바뀌는 것을 방지
	clearInterval(p1.store.time_update_interval);
	p1.store.isAblePlayer = true;
	//p1.store.initFlag = true;	// 하면 안된다
	p1.store.playMode = 9999;
//	p1.store.startFlag = false;
	p1.store.cueFlag = false;
	p1.store.transaction = false;
	p1.store.isplay = false;
	
	clearInterval(p2.store.tempInterval);
	clearInterval(p2.store.time_update_interval);
	p2.store.isAblePlayer = true;
	//p2.store.initFlag = true;
	p2.store.playMode = 9999;
//	p2.store.startFlag = false;
	p2.store.cueFlag = false;
	p2.store.transaction = false;
	p2.store.isplay = false;
		
	
	var currentP;
	var nextP;
	if(_playerName == "player1"){
		currentP = p1;
		nextP = p2;
	}else if(_playerName == "player2"){
		currentP = p2;
		nextP = p1;
	}
	displayControl(currentP.store);
	currentP.player.pauseVideo();
	currentP.store.startTime = Number(jObj.attr("startTime"));
	currentP.store.endTime = Number(jObj.attr("endTime"));
	currentP.store.sentence = jObj.attr("sentence");
	currentP.store.seq = Number(jObj.attr("seq"));
	currentP.store.videoId = jObj.attr("videoId");
	currentP.store.isplay = true;
	currentP.player.loadVideoById(currentP.store.videoId, currentP.store.startTime);
	// click해서, 실행불가능한 영상부터 loop를 시작하면, 현재 영상이 play가 아닌 경우를 interval로 잡아서, 아닌 경우, 다음으로 넘겨야 한다.
	if(isSecond){
		clearInterval(_startInterval);
		_startInterval = setInterval(function () {
			if(_reTryCount2 > 3){
				_reTryCount2 = 0;
				clearInterval(_startInterval);
				_repeatCount = 9999;
				currentP.togglePlayerFn();
			}
			if(currentP.store.playMode == YT.PlayerState.PLAYING){
				_reTryCount2 = 0;
				clearInterval(_startInterval);
				$("#retry").hide();
			}else{
				$("#retry").html("retry: " +_reTryCount2++ + "");
				$("#retry").show();
			}
		}, 1000);
	}
	
	/**
	 * 두번째 대기
	 */
	if(isSecond){
		nextP.player.pauseVideo();
		var jObj = $("#video" + _currentPlaySeq).next();
		if(jObj.length != 0){
			nextP.store.startTime = Number(jObj.attr("startTime"));
			nextP.store.endTime = Number(jObj.attr("endTime"));
			nextP.store.sentence = jObj.attr("sentence");
			nextP.store.seq = Number(jObj.attr("seq"));
			nextP.store.videoId = jObj.attr("videoId");
			nextP.store.transaction = true;
			nextP.store.isplay = false;
			nextP.player.loadVideoById(nextP.store.videoId, nextP.store.startTime);
		}else{
//			console.log("다음 video가 없습니다.");
		}
	}
}

function repeatMaxChange(obj){
	_repeatMax = obj.value;
}
//Helper Functions
//초단위를 분:초 단위로 환산
function formatTime(time){
	time = Math.round(time);
	var minutes = Math.floor(time / 60);
	var seconds = time - minutes * 60;
	seconds = seconds < 10 ? '0' + seconds : seconds;
	return minutes + ":" + seconds;
}
function timeChange(parent, typeId, diff){
	var v = Number($("#" + parent + " #" + typeId).val()) + diff;
	$("#" + parent + " #" + typeId).val(v);
	$("#" + parent + " #" + typeId + "Format").html(formatTime(v));
	var p;
	if(_playerName == "player1"){
		p = p1; 
	}else if(_playerName == "player2"){
		p = p2;
	}
	p.store[typeId] = v;
	
	if(typeId == "startTime"){
		p.player.seekTo(p.store.startTime);
	}
}
function sss(){
	console.warn("p1:" + p1.store.playType + ", p2:" + p2.store.playType);
}
function changeList(obj){
	if($(obj).html() == "list"){
		$(obj).html("Thumb");
		$.each($(".videoClass"), function(i, d){
			$(this).empty();
			$(this).append("<span>" + $(this).attr("sentence") + "</span>");
			$(this).css("border", "1px solid gray");
		});
	}else if($(obj).html() == "Thumb"){
		$(obj).html("list");
		$.each($(".videoClass"), function(i, d){
			$(this).empty();
			$(this).append("<img src='" + $(this).attr("img") + "'></src>");
			$(this).css("border", "0px solid gray");
		});		
	}
}
function displayControl(store){
    $(".videoClass").css("background-color", "white");
    $("#video" + _currentPlaySeq).css("background-color", "orange");
    
	$('#startTime').val(store.startTime);
	$('#endTime').val(store.endTime);
	$('#startTimeFormat').html(formatTime(store.startTime));
	$('#endTimeFormat').html(formatTime(store.endTime));
	$("#sentence").html("<h3 style='text-decoration: underline;height:25px;overflow-y:hidden;'>" + _currentPlaySeq + " : " + store.sentence + "</h3>");	
}