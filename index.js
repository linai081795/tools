$(function () {
    var urlStart = getUrlPrefix() + window.location.host + getGap(), courseId = getQueryString('course_id'), currentItemId = '', historyViewTime, currentTimeLen = 0,
        myPlayer, ifsave = true, timer = '', timerFlag = false, sec = 0, fitemid = getQueryString('scorm_item_id'), userId = getQueryString('user_id'), 
        vipType = '', isShowEnergyInfo = '', currentMinStudyTime = '', djsTime = 0, completeTime = $('#completeTime'), showTime = $('#showTime'), 
        questionK = $('#questionK'), questionFlag = true, ifAllComplate = false, complateFlag = true, ifSetNext = Cookies.get('ifSetNext'), videoDiv = $('#videoDiv'),
        degree = $('.degree'), mark = $('.mark'), nowstatus = $('.nowstatus'), isFinish = '', totalTime = '', prevsec = 0, ifchangeurl = false, isGetJF = false;
        qtitle = $('.qtitle'), qanswerBox = $('.qanswerBox'), ttCount = 0, questionBox = $('.questionBox'), ttFlag = false, perTime = 60, loadLength = 0, theUserId = '',
        courseList = [], currentIndex = 0;
    function events() {
        setDivHeight();
        getPower();
        ckboxChange();
        myPlayer = videojs('my-video');
        currentItemId = fitemid;
        getChapterList();

        judgeTT();
        if(ttFlag){
            var submitAnswer = $('.submitAnswer');
            submitAnswer.on('click',function(){
                var rightAnswer = qtitle.attr('rightA'), userAnswer = [];
                $('.qaInput').each(function(){
                    if($(this).prop('checked')){
                        userAnswer.push($(this).val());
                    }
                });
                if(userAnswer.length == 0){
                    layer.msg('请选择答案！',{time:1200});
                }else{
                    var msgTxt = '';
                    if(userAnswer.join('') == rightAnswer){
                        msgTxt = '答对啦！';
                    }else{
                        msgTxt = '回答错误！正确答案是 '+rightAnswer;
                    }
                    layer.msg(msgTxt,{time:1200},function(){
                        questionBox.hide();
                        myPlayer.play();
                    });
                }
            });
        }

        var backBtn = $('#backBtn'), listUL = $('#listUL'), videoli = $('.section,.childSection'), playChoose = $('.playChoose'), playc = $('.playc'), 
            ifPlayNext = $('#ifPlayNext'), html = $('html');
        
        if(ifSetNext == 1){
            ifPlayNext.prop('checked',true);
        }
        if(ifSetNext == 0){
            ifPlayNext.prop('checked',false);
        }

        playChoose.on('click',function(e){
            stopBubble(e);
            $(this).removeClass('showc');
            playc.addClass('showc');
        });

        ifPlayNext.on('change',function(e){
            stopBubble(e);
            questionFlag = false;
            if($(this).prop('checked')){
                ifSetNext = 1;
                Cookies.set('ifSetNext',1);
            }else{
                ifSetNext = 0;
                Cookies.set('ifSetNext',0);
            }
            window.setTimeout(function(){
                playc.removeClass('showc');
                playChoose.addClass('showc');
            },5000);
        });

        playc.on('click',function(e){
            stopBubble(e);
        });

        html.on('click',function(){
            playc.removeClass('showc');
            playChoose.addClass('showc');
        });

        $('#continuepBtn').on('click',function(){
            Cookies.set('ifSetNext',0);
            ifSetNext = 0;
            ifPlayNext.prop('checked',false);
            questionFlag = false;
            questionK.hide();
            myPlayer.play();
        });

        $('#confirmBtn').on('click',function(){
            Cookies.set('ifSetNext',1);
            ifSetNext = 1;
            ifPlayNext.prop('checked',true);
            questionFlag = false;
            questionK.hide();
            time_fun();
            timerFlag = true;
        });

        $('#conBtn').on('click',function(){
            complateFlag = false;
            $('#endK').hide();
            myPlayer.play();
        });

        $('#noBtn').on('click',function(){
            complateFlag = true;
            $('#endK').hide();
            backBtn.trigger('click');
        });

        myPlayer.on("ended", function(){
            if(currentTimeLen == 0){
                var ctime = parseInt(myPlayer.currentTime()), newsec = sec - prevsec;
                saveSubmit(newsec,ctime,function(){
                    prevsec = sec;
                    var currentLiJ = $('.childSection.active').attr('sec');
                    var nextLiJ = parseInt(currentLiJ) + 1;
                    $('.sec'+nextLiJ).trigger('click');
                });
            }
        });

        myPlayer.on("play",function(){
            if(!timerFlag){
                time_fun();
                timerFlag = true;
            }
        });

        myPlayer.on("pause",function(){
            clearInterval(timer);
            timerFlag = false;
        });

        listUL.delegate('.chapterName', 'click', function () {
            var ifopen = $(this).attr('ifopen');
            if (ifopen == '0') {
                $(this).next().hide();
                $(this).addClass('active').attr('ifopen', '1');
            } else {
                $(this).next().show();
                $(this).removeClass('active').attr('ifopen', '0');
            }
        });

        listUL.delegate('.section,.childSection', 'click', function (e) {
            videoli.removeClass('active');
            $(this).addClass('active');
            var lid = $(this).attr('lid');
            clearInterval(timer);
            timerFlag = false;
            questionK.hide();
            $('#endK').hide();
            var ctime = parseInt(myPlayer.currentTime()), newsec = sec - prevsec, st = saveSubmit(newsec,ctime);
            if (st) {
                prevsec = sec;
                currentItemId = courseList[Number(lid)].lessonId;
                getVideoInfo(lid, $(this));
            }
        });

        backBtn.on('click', function () {
            var ctime = parseInt(myPlayer.currentTime()), newsec = sec - prevsec, st = saveSubmit(newsec,ctime);
            clearInterval(timer);
            timerFlag = false;
            if (st) {
                prevsec = sec;
                var rurl = encodeURLUTF8(getQueryString('returl'));
                window.location.href = '../../course/course_learning.jsp?course_id=' + courseId + '&returl=' + rurl;
            }
        });
    }

    function setDivHeight() {
        if ($('.mainWrapper').height() < 730) {
            $('.mainWrapper').height(730);
            $('.mccon').css('overflow-y', 'scroll');
        }
    }

    function getPower() {
        var url = urlStart + '/newApp_use_energy.action?req=getUserAuthority', res = getData(url), data = '';
        if (res.code == 1000) {
            data = dedata(res.data);
            vipType = data._vipType;
            isShowEnergyInfo = data._isShowEnergyInfo;
            theUserId = data.userId;
            if (isShowEnergyInfo && vipType != 1) {
                $('.diamondAlert').show();
            }
            if(!isShowEnergyInfo){
                $('.lastE').hide();
            }
            var isStu = data._isStu;
            if(isStu == 1){
                isGetJF = data._isJFGZ == 1 ? true : false;
            }else{
                isGetJF = data._isJF == 1 ? true : false;
            }
            if(isEmpty(ifSetNext) && data._isAutoPlay == 0){
                questionFlag = false;
                ifSetNext = 0;
            }
        }
    }

    var z = 0;
    function getChapterList() {
        var params = {
            'course_id': courseId
        }
        var url = urlStart + '/newApp_learn_course.action?req=getCourseScormItemList', res = getData(url, params), str = '';
        if (res.code == 1000) {
            var resdata = dedata(res.data);
            $('.courseName').html('<span></span>' + resdata.courseName);
            var data = resdata.listCourseLesson, i = 0, len = data.length, ulFlag = false;
            for (; i < len; i++) {
                if(data[i].isChapter){
                    if(ulFlag){
                        ulFlag = false;
                        str += '</ul>'
                             + '</li>';
                    }
                    str += '<li class="chapter">'
                         + '<p class="chapterName" ifopen="0"><span></span>' + data[i].chapterName + '</p>'
                         + '<ul class="secondul">';
                    ulFlag = true;
                }else{
                    var showStr = '',perUse = data[i].useEnergyNum, activeC = '';
                    if(data[i].lessonId == fitemid){
                        perUse = 0;
                        activeC = 'active';
                        currentIndex = i;
                    }
                    if (isShowEnergyInfo) {
                        if (vipType == 2) {
                            showStr = '<div class="energyBox vipBox">应耗能量 ' + perUse + '</div>';
                        }
                        if (vipType == 0){
                            showStr = '<div class="energyBox">应耗能量 ' + perUse + '</div>';
                        }
                    } else {
                        showStr = '';
                    }
                    z++;
                    str += '<li class="childSection sec'+z+' '+activeC+'" sec="'+z+'" lid="' + i + '">' + showStr + '<span></span>' + data[i].lessonName + '</li>';
                }
            }
            $('#listUL').append(str);
            courseList = data;
            getVideoInfo(currentIndex);
        }
    }

    function getVideoInfo(siid, obj) {
        videoDiv.css('pointer-events','none');
        ifchangeurl = false;
        currentIndex = Number(siid);
        var data = courseList[currentIndex], flag = true;
        var title = data.lessonName, playUrl = data.playUrl, useEnergyNum = data.useEnergyNum;

        //临时修改
        if(window.location.host != "learning.wuxuejiaoyu.cn" && window.location.host != "xuexi.wencaischool.net"){
            playUrl = playUrl.replace(/wencaischool\.com/gi,"wencaischool.net")
                                .replace("source.wencaischool.net/ispace2_upload/","cnet-s1.wencaischool.net/ispace2_upload/")
                                .replace("source.wencaischool.net/ispace2_upload2/","cnet-s2.wencaischool.net/ispace2_upload2/")
                                .replace("source.wencaischool.net/ispace2_upload3/","cnet-s3.wencaischool.net/ispace2_upload3/")
                                .replace("source.wencaischool.net/ispace2_upload4/","cnet-s4.wencaischool.net/ispace2_upload4/")
                                .replace("source.wencaischool.net/ispace2_upload5/","cnet-s5.wencaischool.net/ispace2_upload5/")
                                .replace("source.wencaischool.net/ispace2_upload6/","cnet-s6.wencaischool.net/ispace2_upload6/");
        }

        totalTime = data.finishLen;
        isFinish = data.isFinish;
        historyViewTime = data.videoPosition;
        currentMinStudyTime = data.minTime;
        currentTimeLen = data.timeLen;
        if (isShowEnergyInfo && vipType != 1) {
            flag = useEnergy(currentItemId);
        }
        if (flag) {
            $('.videoName').text(title);
            $('.vname').text(title);
            $('.atime').text(toTimeStr(totalTime));
            ifsave = true;
            sec = 0;
            prevsec = 0;
            showTime.text('00:00:00');
            if (!isEmpty(playUrl)) {
                if (obj) {
                    obj.find('.energyBox').text('应耗能量 0');
                }
                myPlayer.one('loadedmetadata',function(){
                    if(!ifchangeurl && myPlayer.duration() > 0){
                        ifchangeurl = true;
                        loadLength = parseInt(myPlayer.duration());
                        currentMinStudyTime = currentMinStudyTime < loadLength ? currentMinStudyTime : loadLength;
                        var percentD = isFinish ? 100 : (totalTime < currentMinStudyTime ? (totalTime/currentMinStudyTime*100).toFixed(2) : 100);
                        degree.css('width', percentD+'%');
                        mark.text(percentD);
                        if (percentD == 100) {
                            nowstatus.removeClass('ing').addClass('have').text('已完成学习');
                            ifsave = false;
                        } else {
                            nowstatus.removeClass('have').addClass('ing').text('正在学习中');
                        }
                        djsTime = isFinish ? 0 : (totalTime < currentMinStudyTime ? (currentMinStudyTime - totalTime) : 0);
                        completeTime.text(djsTime);
                        videoDiv.css('pointer-events','auto');
                        console.log(historyViewTime);
                        console.log(ifSetNext);
                        if (historyViewTime > 0 && ifSetNext == 0) {
                            layer.confirm('是否继续上次播放？', {
                                btn: ['是', '否']
                            }, function (index) {
                                myPlayer.currentTime(historyViewTime);
                                myPlayer.play();
                                layer.close(index);
                            }, function (index) {
                                myPlayer.currentTime(0);
                                myPlayer.play();
                                layer.close(index);
                            });
                        } else {
                            myPlayer.play();
                        }
                    }
                });
                myPlayer.src(playUrl);
                myPlayer.load();
            } else {
                myPlayer.pause();
                myPlayer.src('');
                layer.msg('未找到视频地址!', {time: 1000});
            }
        }
    }

    function useEnergy(siid) {
        var params = {
                'learning_user_id': userId,
                'course_id': courseId,
                'type_code': 'progress',
                'item_id': siid
            },
            url = urlStart + '/newApp_use_energy.action?req=saveUseEnergyInfo', res = getData(url, params), ret = false;
        if (res.code == 1000) {
            ret = true;
            var data = dedata(res.data);
            $('#lastEnergy').text(data);
        } else {
            myPlayer.src('');
            layer.msg(res.message, {time: 1000});
        }
        return ret;
    }

    function two_char(n) {
        return n >= 10 ? n : "0" + n;
    }

    function time_fun() {
        timer = setInterval(function () {
            sec++;
            var date = new Date(0, 0);
            date.setSeconds(sec);
            var h = date.getHours(), m = date.getMinutes(), s = date.getSeconds();
            showTime.text(two_char(h) + ":" + two_char(m) + ":" + two_char(s));
            if(djsTime > 0){
                djsTime--;
                completeTime.text(djsTime);
                var percentD = ((totalTime+sec)/currentMinStudyTime*100).toFixed(2);
                degree.css('width', percentD+'%');
                mark.text(percentD);
            }
            if(ifAllComplate && complateFlag){
                myPlayer.pause();
                $('#endK').show();
                clearInterval(timer);
                timerFlag = false;
            }
            if(questionFlag && djsTime == 0 && isEmpty(ifSetNext)){
                myPlayer.pause();
                questionK.show();
                clearInterval(timer);
                timerFlag = false;
            }
            if(djsTime == 0 && ifSetNext == 1){
                var currentLiJ = $('.childSection.active').attr('sec');
                var nextLiJ = parseInt(currentLiJ) + 1;
                $('.sec'+nextLiJ).trigger('click');
            }
            if (djsTime == 0 && ifSetNext != 1 && ifsave) {
                ifsave = false;
                var ctime = parseInt(myPlayer.currentTime()), newsec = sec - prevsec, st = saveSubmit(newsec,ctime);
                if (st) {
                    prevsec = sec;
                    degree.css('width', '100%');
                    mark.text('100');
                    nowstatus.removeClass('ing').addClass('have').text('已完成学习');
                }
            }
            if(ttFlag){
                if(sec > 0 && sec%perTime == 0){
                    showQuestion();
                }
            }
        }, 1000);
    }

    function toTimeStr(tt) {
        var dt = new Date(0, 0);
        dt.setSeconds(tt);
        var h = dt.getHours(), m = dt.getMinutes(), s = dt.getSeconds();
        return two_char(h) + ":" + two_char(m) + ":" + two_char(s);
    }

    function saveSubmit(leaveTime,playTime,comDO){
        if(!ifchangeurl || loadLength == 0){
            return true;
        }
        var params = {
            'user_id': userId,
            'course_id': courseId,
            'time': leaveTime,
            'item_id': currentItemId,
            'view_time': loadLength,
            'last_view_time': playTime,
            'video_length': currentTimeLen,
            'learning_user_id': theUserId
        },
        url = urlStart + '/learning.action?req=submitScormAndHistorySave', res = getData(url,params);
        if(res.code == 5000){
            return true;
        }
        if(res.code == 1000){
            var data = dedata(res.data);
            courseList[currentIndex].videoPosition = data.videoPosition;
            courseList[currentIndex].finishLen = data.finishLen;
            courseList[currentIndex].isFinish = data.isFinish;
            ifAllComplate = data.allFinish;
            if(comDO && data.isFinish){
                comDO();
            }
            if(isGetJF){
                var jfparams = {
                    'course_id': courseId,
                    'user_id': userId,
                    'item_id': currentItemId,
                    'learn_type': 'progress'
                },
                jfurl = urlStart + '/newApp_point.action?req=savePointsOnlyProAndBbs', jfres = getData(jfurl,jfparams);
                if(jfres.code == 1000 && !isEmpty(jfres.data)){
                    $('.getPointAlert span').text(dedata(jfres.data));
                    $('.getPointAlert').show();
                    window.setTimeout(function(){
                        $('.getPointAlert').hide();
                    },3000);
                }
            }
            return true;
        }else{
            return false;
        }
    }

    function judgeTT(){
        var params = {
            'user_id': userId
        },
        url = urlStart + '/random_get_item.action?req=getSwitchStatus', res = getData(url,params);
        if(res.code == 1000){
            var data = dedata(res.data);
            ttFlag = data.text == 1 ? true : false;
            perTime = parseInt(data.vaule);
        }
    }

    function showQuestion(){
        qtitle.text('').attr('rightA','');
        qanswerBox.html('');
        var params = {
            'course_id': courseId,
            'user_id': userId
        },
        url = urlStart + '/random_get_item.action?req=getCourseScormItemList', res = getData(url,params), data = '';
        if(res.code == 1000){
            data = dedata(res.data);
            var smallItemType = data.smallItemType, typeShow = smallItemType == 3 ? '(单选题)' : '(多选题)', typeInput = smallItemType == 3 ? 'radio' : 'checkbox',
                samllItemName = data.samllItemName, optionNodes = data.optionNodes, answer = data.smallItemAnswer[0].optionContent;
            qtitle.text(typeShow+' '+samllItemName).attr('rightA',answer);
            var i = 0, len = optionNodes.length, str = '';
            for(;i<len;i++){
                str += '<div class="perqb">'
                     + '<input type="'+typeInput+'" value="'+optionNodes[i].option+'" class="qaInput" name="qinput" id="a'+optionNodes[i].option+'">'
                     + '<label for="a'+optionNodes[i].option+'">'+optionNodes[i].option+'.'+optionNodes[i].optionContent+'</label>'
                     + '</div>';
            }
            qanswerBox.append(str);
            myPlayer.pause();
            questionBox.show();
        }
    }

    events();
});