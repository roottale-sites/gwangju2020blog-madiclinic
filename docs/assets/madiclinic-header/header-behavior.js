// 원본: /js/common.js L64-83(헤더 slideDown), L85-260(토글·PC hover·모바일 드로어). jQuery 1.11 기준 동작 참고용.
	$(".slideanim4").each(function(){
		slideDownAni()
	});
	$(window).scroll(function() {
		slideDownAni()
	});
	function slideDownAni() {
		$(".slideanim4").each(function(){
			var pos = $(this).offset().top;
			var winTop = $(window).scrollTop();
			if (pos < winTop + 800) {
				$(this).addClass("slideDown");
			}
		});
	}
});
/* Scroll Slide Up End */
/********************************************************************/

/* Toggle Start */
/*
$(function() {
	$('#naviToggle').css('cursor','pointer').click(function(){
		$('.line').removeClass('init');
		$('#line-top').toggleClass('line-top').toggleClass('top-reverse');
		$('#line-mid').toggleClass('line-mid').toggleClass('mid-reverse');
		$('#line-bot').toggleClass('line-bot').toggleClass('bot-reverse');
		if($('#line-top').hasClass('line-top')) {
			$('#naviToggle').addClass('on');
		} else {
			$('#naviToggle').removeClass('on');
		}
	});
});
*/
/* Toggle End */

/********************************************************************/
/* Scroll NAvi Menu Start */
$(function(){

	var mode = "";
	mode = getDeivce();

	function getDeivce() {
		var mode = "PC";
		if($("#naviToggle").css("display") == "none") {
			mode = "PC";
		} else {
			mode = "MO";
		}
		return mode;
	}

	function toggleAni() {
		$('.line').removeClass('init');
		$('#line-top').toggleClass('line-top').toggleClass('top-reverse');
		$('#line-mid').toggleClass('line-mid').toggleClass('mid-reverse');
		$('#line-bot').toggleClass('line-bot').toggleClass('bot-reverse');
		if($('#line-top').hasClass('line-top')) {
			$('#naviToggle').addClass('on');
		} else {
			$('#naviToggle').removeClass('on');
		}
	}

	function getPcScript() {
		$(".menuNavi").off();
		$(".menuNavi > li").off();
		$(".menuNavi > li > a").off();
		$("#naviToggle").off();
		$(".selectTab").off();
		$(".officialWeb").off();

		$("#naviBlack").css("z-index","-1");
		$("#naviBlack").css("right","-100%");

		$(".menuNavi").css({"display":"block"});
		$(".menuNavi").css({"right":""});
		$(".menuNavi > li").removeClass("on");
		$("ul.subMenu").slideUp("fast");
		$("ul.topLink").css({"display":"block"});
		$("ul.topLink").css({"right":""});
		$(".officialWeb").css({"display":"block"});
		$(".officialWeb").css({"right":""});

		$(".menuNavi > li > a").on("mouseenter focusin", function() {
			if($(this).parent().hasClass("on") === true) {
				$(".menuNavi > li").removeClass("on");
			} else {
				$(".menuNavi > li").removeClass("on");
				$(".menuNavi > li > ul").slideUp("fast");
			}
			$(this).parent().addClass("on");
			$("+ul", this).slideDown("fast");

			$(".menuNavi").mouseleave(function() {
				$(".menuNavi > li").removeClass("on");
				$(".menuNavi > li > ul").slideUp("fast");
			});
		});
		$(".menuNavi").mouseleave(function() {
			$(".menuNavi > li").removeClass("on");
			$(".menuNavi > li > ul").slideUp("fast");
		});
		$("*:not('.menuNavi *')").on("focus", function() {
			$(".menuNavi > li").removeClass("on");
			$(".menuNavi > li > ul").slideUp("fast");
		})

		/* sub page tab menu */
		/* $(".tabMenuArea").css("display","block"); */

	}
	function getMobileScript() {
		$(".menuNavi").off();
		$(".menuNavi > li").off();
		$(".menuNavi > li > a").off();
		$("#naviToggle").off();
		$(".selectTab").off();
		$(".officialWeb").off();

		$(".menuNavi").css({"display":"none"});
		$("body").css("overflow","visible");
		$("#naviBlack").css("z-index","-1");
		$("#naviBlack").css("right","-100%");
		$(".mobileHome").css({"right":"-320px"});
		$(".menuNavi").css({"right":"-320px"});
		$(".mobileNavi > li").removeClass("on");
		$("ul.subMenu").slideUp("fast");
		$(".officialWeb").css({"display":"none"});

		$("#naviToggle").css("cursor", "pointer").on("click", function() {
			toggleAni();
			if($(".menuNavi").css("right") == "0px") {
				$("body").css("overflow","visible");
				$(".mobileHome").css({"right":"-320px"});
				$(".menuNavi").css({"display":"none"});
				$(".menuNavi").css({"right":"-320px"});
				$(".menuNavi > li > ul").slideUp("fast");
				$(".menuNavi > li").removeClass("on");
				$("#naviBlack").css("z-index","-1");
				$("#naviBlack").css("right","-100%");
				$("ul.topLink").css({"display":"none"});
				$("ul.topLink").css({"right":"-320px"});
				$(".officialWeb").css({"display":"none"});
				$(".officialWeb").css({"right":"-320px"});

				$("#naviToggle").attr("title","전체메뉴 열기");
			} else {
				$("body").css("overflow","hidden");
				$(".mobileHome").css({"right":"0"});
				$(".menuNavi").css({"display":"block"});
				$(".menuNavi").css({"right":"0"});
				$("#naviBlack").css("right","0");
				$("#naviBlack").css("z-index","10");
				$("ul.topLink").css({"display":"block"});
				$("ul.topLink").css({"right":"0px"});
				$(".officialWeb").css({"display":"block"});
				$(".officialWeb").css({"right":"0px"});

				$("#naviToggle").attr("title","전체메뉴 닫기");
			}
		});

		// $(".menuNavi > li > a").css("cursor", "pointer").click(function() {
		$(".menuNavi > li > a").on("click", function() {
			var _chkClass = $(this).attr("class");
			if(_chkClass == "subNone") {
				$(".menuNavi > li").removeClass("on");
				$(".menuNavi > li > ul").slideUp("fast");
				location.href = $(this).attr("href");
			} else {
				if($(this).parent().children("ul").css("display") == "none") {
					$(this).parent().addClass("on");
					$(this).parent().children("ul").slideDown("fast");
				} else {
					$(this).parent().removeClass("on");
					$(this).parent().children("ul").slideUp("fast");
				}
			}
			return false;
		});
		$("*:not('.menuNavi *')").on("focus", function() {
			$(".menuNavi > li").removeClass("on");
			$(".menuNavi > li > ul").slideUp("fast");

			$("body").css("overflow","visible");
			$(".mobileHome").css({"right":"-320px"});
			$("#naviBlack").css("z-index","-1");
			$("#naviBlack").css("right","-100%");
			$(".menuNavi > li > ul").slideUp("fast");
			$(".menuNavi > li").removeClass("on");
			$(".menuNavi").css({"right":"-320px"});
			$(".menuNavi").css({"display":"none"});
			$("ul.topLink").css({"display":"none"});
			$("ul.topLink").css({"right":"-320px"});
