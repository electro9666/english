var isLoop = true;		// 연속재생 or 단일반복재생
var isRepeat = true;
var repeatMax = 1;
var repeatCount = 0;
var pList = [];			// p0, p1
var CPN = 0;			// currentPlayerNumber : 0, 1
var CVS = 0;			// currentVideoSeq : 0,1,2,3,4,5,6,,,
var speed = 1.0;
var startMargin = 0;
var endMargin = 0;

var tempInterval;
var tempInterval2;
var tempInterval3;
var retryCount = 0;
function clickVideo(obj){
	
}
function setPlayerPause(playerNum, VNum){
	// currentVideoSeq 부터 시작
	
	// 둘다 load가 안되어 있으면
//	if(!p1.store.initReady && !p2.store.initReady){
//		alert("youtube player(YT)가 준비되지 않아서 화면을 갱신합니다.");
//		location.reload();
//	}
	

//	
}

function endPlayer(){
	// 현재 위치에 다다음 video를 준비하기
	pList[now(CPN)].store.block = true;
	pList[now(CPN)].store.cvs = nextNextCVS();
	pList[now(CPN)].player.setVolume(0);
	pList[now(CPN)].player.loadVideoById(list[nextNextCVS()].videoId, getStartTime(nextNextCVS()));
	
	/** 적용 player 위치 변경 */
	console.warn(CPN + "-->" + other(CPN));
	CPN = other(CPN);
	
	// 변경된 위치에서 재생
	setPlaying();
}

function setPlaying(){
	setCVS(pList[now(CPN)].store.cvs);	/** CVS 갱신 ++ */
	
	console.warn("CPN:" + CPN + ", " + "CVS:" + getCVS() + ", nextCVS:" + nextCVS() + ", nextNextCVS:" + nextNextCVS());
	
	isRepeat = true;	// 새로 시작하면, 무조건 repeat
	$("#isRepeat").prop("checked", true);
	
	$("#parentIframe" + CPN).css("z-index", "10");
	$("#parentIframe" + other(CPN)).css("z-index", "1");
	
    $(".videoClass").css("background-color", "white");
    $("#video" + getCVS()).css("background-color", "orange");
    
	$('#startTime').val(getStartTime(getCVS()));
	$('#endTime').val(getEndTime());
	$('#startTimeFormat').html(formatTime(getStartTime(getCVS())));
	$('#endTimeFormat').html(formatTime(getEndTime()));
//	$("#sentence").html("[" + CVS + "] <span style='height:25px;font-size:20px;overflow-y:hidden;'>" + list[getCVS()].sentence + "</span>");
	$("#title").html("[" + CVS + "] <span style='height:25px;font-size:20px;overflow-y:hidden;'>video loading...</span>");
	
	// 첫번째 재생
	resetRetryCount();
	clearInterval(tempInterval2);
	tempInterval2 = setInterval(function () {
		console.log('retryCount:' +retryCount);
		if(++retryCount > 5){
			resetRetryCount();
			clearInterval(tempInterval2);
			// TODO 다음 플레이어에 접근 넘깅
			endPlayer();
		}
		
		if(pList[now(CPN)].store.playReady){
			resetRetryCount();
			clearInterval(tempInterval2);
			pList[now(CPN)].store.playReady = false;
			pList[now(CPN)].store.block = false;
			pList[now(CPN)].player.playVideo();		// pause 라면,
			
			// TODO playing 확인
			clearInterval(tempInterval3);
			tempInterval3 = setInterval(function () {
				if(++retryCount > 5){
					resetRetryCount();
					clearInterval(tempInterval3);
					// TODO 다음 플레이어에 접근 넘깅
					endPlayer();
				}
				if(pList[now(CPN)].store.state == YT.PlayerState.PLAYING){
					resetRetryCount();
					clearInterval(tempInterval3);
				}else{
					console.log("계속 시도");
					showRetryCount();
					pList[now(CPN)].player.playVideo();
				}
			}, 1000);
		}else{
			console.log("계속 시도");
			showRetryCount();
			pList[now(CPN)].store.block = true;
			pList[now(CPN)].player.playVideo();	// playReady 하기 위해 계속 시도 5회
		}
	}, 1000);
}

function firstStartPlayer(){
	resetRetryCount();
	if(pList[0].store.initReady && pList[1].store.initReady){
		if(pList[0].state == YT.PlayerState.PLAYING){
			pList[0].player.pauseVideo();
		} 
		if(pList[1].state == YT.PlayerState.PLAYING){
			pList[1].player.pauseVideo();
		}

		firstStartPlayerDetail();
	}else{
		clearInterval(tempInterval);
		tempInterval = setInterval(function () {
			retryCount++;
			if(pList[0].store.initReady && pList[1].store.initReady){
				
				firstStartPlayerDetail();
			}else{
				showRetryCount();
			}
		}, 1000);
	}
}
function firstStartPlayerDetail(){
	resetRetryCount();
	clearInterval(tempInterval);
	console.log('all ready');
	// player0 준비
	pList[now(CPN)].store.block = true;
	pList[now(CPN)].store.cvs = getCVS();
	pList[now(CPN)].player.loadVideoById(list[getCVS()].videoId, getStartTime(getCVS()));
	// player1 준비
	pList[other(CPN)].store.block = true;
	pList[other(CPN)].store.cvs = nextCVS();
	pList[other(CPN)].player.setVolume(0);
	console.log("getStartTime(nextCVS()) : " + getStartTime(nextCVS()));
	pList[other(CPN)].player.loadVideoById(list[nextCVS()].videoId, getStartTime(nextCVS()));
	
	setPlaying();
}
function resetRetryCount(){
	console.log('resetRetryCount');
	retryCount = 0;
	$("#retry").hide();
}
function showRetryCount(){
	$("#retry").show();
	$("#retry").html("retry: " + retryCount);
}
function now(num){	//now
	return num;
}
function other(num){	//other
	// 1 -> 0
	// 0 -> 1
	return Number(!(num == true));
}
function setCVS(num){
	if(num < 0){
		num = list.length -1;
	}else if(num >= list.length){
		num = 0;
	}
	CVS = num;
}
function getCVS(){
	return CVS;
}
function nextCVS(){
	if(CVS >= list.length - 1){
		return 0;
	}else{
		return CVS + 1;
	}
}
function nextNextCVS(){
	if(list.length == 1){
		return 0;
	}else{
		if(CVS >= list.length - 2){
			return CVS - (list.length - 2);
		}else{
			return CVS + 2;
		}		
	}
}

function getStartTime(cvs){
	if(isRepeat){
		var t = list[cvs].startTime + startMargin;
		if(t < 0){
			return 0;
		}
		return t; 
	}else{
		return 0;
	}
}
function getEndTime(){
	if(list[getCVS()].endTime == 0){
		var endTime3 = parseInt(Number(pList[CPN].player.getDuration()), 10);
		console.log();
		
		if(endTime3 - getStartTime(getCVS()) > 10){
			// TODO endTime3이 너무 길때
			endTime3 = getStartTime(getCVS()) + 10;
		}
		
		list[getCVS()].endTime = endTime3;
	}
	
	return list[getCVS()].endTime + endMargin;
}
var makePlayer = function(num, iframeId){
	var store = {};
	store.num = num;
	store.state = 9999;
	store.initReady = false;
	store.playReady = false;
	
	var timeInterval3;
	var player = new YT.Player(iframeId, {
        width: 550,
        height: 500,
        videoId: '',
        playerVars: {
            playlist: ''
            ,controls: 1
            ,cc_load_policy: 0
//            ,fs:0
//            ,showinfo:0
        },
        events: {
            onReady: oninitReady
            , onPlaybackQualityChange : onPlaybackQualityChange
            , onStateChange : onStateChange
            , onError : onError
        }
    });
	function storeSetting(seq, videoId){
		store.seq = seq;
		store.videoId = videoId;
	}
	function onPlaybackQualityChange(){}
	function onError(event){
		console.warn('error: ' + event.data);
//		if(player.num = CPN){
//			endPlayer();
//		}
//		2 – 요청에 잘못된 매개변수 값이 포함되어 있습니다. 예를 들어 11자리가 아닌 동영상 ID를 지정하거나 동영상 ID에 느낌표 또는 별표와 같은 잘못된 문자가 포함된 경우에 이 오류가 발생합니다.
//		5 – 요청한 콘텐츠를 HTML5 플레이어에서 재생할 수 없거나 HTML5 플레이어와 관련된 다른 오류가 발생했습니다.
//		100 – 요청한 동영상을 찾을 수 없습니다. 어떠한 이유로든 동영상이 삭제되었거나 비공개로 표시된 경우에 이 오류가 발생합니다.
//		101 – 요청한 동영상의 소유자가 내장 플레이어에서 동영상을 재생하는 것을 허용하지 않습니다.
//		150 – 이 오류는 101과 동일하며 변형된 101 오류입니다.
	}
	function oninitReady(){
		console.log(num + " initReady");
		store.initReady = true;
	}
	function onStateChange(event){
		store.state = event.data;
		var state = "undefiend";
	    switch (event.data) {
	        case YT.PlayerState.UNSTARTED:	//-1
	            state = "unstarted";
	            updateRepeatCount(0);
	            clearInterval(timeInterval3);
	            break;
	        case YT.PlayerState.ENDED:		//0
	            state = "ended";
	            updateRepeatCount(0);
	            clearInterval(timeInterval3);
	            endCheck();
	            break;
	        case YT.PlayerState.PLAYING:	//1
	            state = "playing";
	            if(store.block){
	            	player.pauseVideo();
	            	return;
	            }
	            
	            /** real playing */
	            if(getEndTime)
	            
	            $("#title").html("[" + CVS + "] <span style='height:25px;font-size:20px;overflow-y:hidden;'>" + pList[now(CPN)].player.getVideoData().title + "</span>");
	            $("#sentence").html(list[getCVS()].sentence);
	            player.setPlaybackRate(speed);
	    	    clearInterval(timeInterval3);
	    	    timeInterval3 = setInterval(function () {
	    	    	updateRepeat();
	    	    }, 500);
	            
	            break;
	        case YT.PlayerState.PAUSED:		//2
	            state = "paused";
	            clearInterval(timeInterval3);
	            if(store.block){
	            	player.setVolume(100);
	            	store.playReady = true;
	            }
	            break;
	        case YT.PlayerState.BUFFERING:	//3
	            state = "buffering";
	            clearInterval(timeInterval3);
	            break;
	        case YT.PlayerState.CUED:		//5
	            state = "video cued";
	            updateRepeatCount(0);
	            clearInterval(timeInterval3);
	            break;
	        default:
	            state = "unknown (" + event.data + ")";
	    }
//	    console.log(name + ", p1:" + p1.store.playType + ", p2:" + p2.store.playType);
	}
	
	function updateRepeat(){
		$("#currentTimeFormat").html(formatTime(player.getCurrentTime()) + " (<font style='font-size:20px;color:red;'>" + parseInt(player.getCurrentTime() - getEndTime(), 10) + "</font>)");
		
		if(isRepeat){	// 구간 반복
			if(player.getCurrentTime() < getStartTime(getCVS())){
				console.log(num + " player.getCurrentTime() < list[CVS].startTime");
				player.seekTo(getStartTime(getCVS()));
			}			
			if(player.getCurrentTime() > getEndTime()){
				console.log(num + " player.getCurrentTime() > list[CVS].endTime");
				endCheck();
			}		
		}else{
			if(store.state == YT.PlayerState.ENDED){
				endCheck();
			}
		}
	}
	function endCheck(){
		updateRepeatCount(++repeatCount);
		if(isLoop && repeatCount >= repeatMax){
			updateRepeatCount(0);
			player.pauseVideo();
			endPlayer();
		}else{
			player.seekTo(getStartTime(getCVS()));
		}
	}
	function playRepeatEnd(){
		
	}
	function playEnd(){
		
	}
	
	return {player:player, store:store};
}
function init1(){
	var source = $("#player_template").html(); 
	var template = Handlebars.compile(source);
	
	console.log("list.length:" + list.length);
	
	// TODO suffle
	list.sort(function() {
	  return .5 - Math.random();
	});
	
	for(var i = 0 ; i<list.length; i++){
//	for(var i = 0 ; i<4 ; i++){
		list[i].seq = i;
		
//    	if(list[i].endTime != 0){
//    		list[i].endTime = list[i].endTime + 1;	// TODO endTime margin	
//    	}
		var html = template(list[i]);
		$("#mainDiv").append(html);
		
		// API
		$(".videoClass[seq=" + i + "]").attr("img", list[i].img);
		$(".videoClass[seq=" + i + "] img").attr("src", list[i].img);
	}
	
	pList[0] = makePlayer(0, "youtubeIframe0");			
	pList[1] = makePlayer(1, "youtubeIframe1");
	
	startMargin = Number($("#startMargin").val());
	endMargin = Number($("#endMargin").val());
	
	firstStartPlayer();
}
/** YT callback */
function onYouTubeIframeAPIReady() {
	if(typeof q == "undefined" || typeof list == "undefined"){
		$("#mainContents").hide();		
		$("#mainContents2").show();
		alert("데이터가 존재하지 않습니다. 다시 시도해주세요.");
		return;
	}
	$("#headerSentenceId").html(q + " (" + list.length + ")");
	var active = $("#leftSide li a.active");
	active.html(active.html() + " (" + list.length + ")");
	init1();
}


// UI event
function repeatMaxUpdate(obj){
	repeatMax = Number($("#repeatMax").val());
}
function makeLoop(obj){
	isLoop = true;
	updateRepeatCount(0);
	repeatMax = Number($("#repeatMax").val());
	$("#btn0").addClass("btn-primary");
	$("#btn0").removeClass("btn-default");
	$("#btn1").removeClass("btn-primary");
	$("#btn1").addClass("btn-default");
	$("#repeatMax").removeAttr("disabled");
}
function makeLoop1(obj){
	isLoop = false;
	updateRepeatCount(0);
	$("#btn0").removeClass("btn-primary");
	$("#btn0").addClass("btn-default");	
	$("#btn1").addClass("btn-primary");
	$("#btn1").removeClass("btn-default");
	$("#repeatMax").attr("disabled", "disabled");
}
function updateRepeatCount(num){
	repeatCount = num;
	if(isLoop){
		$("#repeatCount").html("(" + (repeatCount+1) + "/" + repeatMax + "회 반복 중" + ")");
	}else{
		$("#repeatCount").html("(" + (repeatCount+1) + "회 반복 중)");
	}
}
function timeChange(type, diff){
	var v;
	if(type == "start"){
		v = Number($("#startTime").val()) + diff;
		if(v < 0){
			v = 0;
		}
	}else if(type == "end"){
		v = Number($("#endTime").val()) + diff;
	}

	timeUpdate(type, v);
}
function timeChange2(type, obj){
	timeUpdate(type, Number($(obj).val()));
}
function timeUpdate(type, v){
	if(type == "start"){
		list[getCVS()].startTime = v;
		$("#mainControl #startTime").val(v);
		$("#mainControl #startTimeFormat").html(formatTime(v));
		
		pList[now(CPN)].player.seekTo(getStartTime(getCVS()));
	}else if(type == "end"){
		list[getCVS()].endTime = v;
		$("#mainControl #endTime").val(v);
		$("#mainControl #endTimeFormat").html(formatTime(v));		
	}
}
function clickVideo(obj){
	setCVS(Number($(obj).attr("seq")));
	firstStartPlayer();
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
function goPrev(diff){
	setCVS(getCVS() + diff);
	firstStartPlayer();
}
function speedUpdate(obj){
	console.log();
	speed = Number($(obj).val());
	pList[now(CPN)].player.setPlaybackRate(speed);	
}
function marginUpdate(type, obj){
	var v = Number($(obj).val());
	if(type == "start"){
		startMargin = v;
	}else if(type == "end"){
		endMargin = v;
	}	
	
	if(type == "start"){
		$("#mainControl #startTime").val(getStartTime(getCVS()));
		$("#mainControl #startTimeFormat").html(formatTime(getStartTime(getCVS())));
		
		pList[now(CPN)].player.seekTo(getStartTime(getCVS()));
	}else if(type == "end"){
		$("#mainControl #endTime").val(getEndTime());
		$("#mainControl #endTimeFormat").html(formatTime(getEndTime()));		
	}	
}
function repeatFlagUpdate(obj){
	if(obj.checked){
		isRepeat = true;
	}else{
		isRepeat = false;
	}
}

// p0, p1에 이미 동영상이 준비되어 있는데, 
// isRepeat을 바꾸면, startTime이 변경되어야 하는데, 너무 번거롭다. 이미 준비해 놓은 것을 또 바꿔줘야 한다..-_-;
// --> 구간반복은 현재범위안헤서만 유효하다. 리스트가 넘어가면 항상 true