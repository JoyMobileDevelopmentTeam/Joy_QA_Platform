;
(function() {

	var pageNum = -1;
	var pageClick = null;
	//每页数据条数
	var perNum = 10;

	function setCallback(page) {
		pageClick = page;

		if(page != null || page != undefined) {
			$('#pre_page').click(function() {
				if(getCurrPage() > 1) {
					setPage(getCurrPage() - 1);
					pageClick(getCurrPage());
				}
			});
			$('#next_page').click(function() {
				if(getCurrPage() < pageNum) {
					setPage(getCurrPage() + 1);
					pageClick(getCurrPage());
				}
			});
			//添加各页数的点击事件
			for(var i = 1; i <= 5; i++) {
				$('#page' + i).click(function(event) {
					var clickPage = parseInt($(event.target).text())
					setPage(clickPage);
					pageClick(clickPage);
				});
			}
		}
	}

	function setPage(currPage) {
		if(pageNum == -1) {
			//未设置总页数
			console.log('未设置总页数');
			return;
		}
		if(currPage < 1 || currPage > pageNum) {
			//无效页数
			console.log('无效页数:' + currPage);
			return;
		}
		if(pageNum < 5) {
			//当数据不能填满5页时
			for(var i = 1; i <= 5; i++) {
				if(i <= pageNum){
					//显示需要的页数
					$('#page' + i).show();
				}else{
					//隐藏不用的元素
					$('#page' + i).hide();
				}
			}
			for(var i = 0; i <= pageNum; i++) {
				setText(i, i);
			}
		} else {
			//数据超过5页
			setPages(currPage, pageNum);
		}

		//处理上一页，下一页是否显示
		if(currPage == 1) {
			$('#pre_page_wrapper').addClass('disabled');
			$('#next_page_wrapper').removeClass('disabled');
		} else if(currPage == pageNum) {
			$('#next_page_wrapper').addClass('disabled');
			$('#pre_page_wrapper').removeClass('disabled');
		} else {
			$('#pre_page_wrapper').removeClass('disabled');
			$('#next_page_wrapper').removeClass('disabled');
		}

		//仅有一页
		if(pageNum == 1) {
			$('#pre_page_wrapper').addClass('disabled');
			$('#next_page_wrapper').addClass('disabled');
		}

		//设置当前页选中样式
		for(var i = 1; i <= 5; i++) {
			if(parseInt(($('#page' + i).text())) == currPage) {
				$('#page' + i).parent().addClass('active');
			} else {
				$('#page' + i).parent().removeClass('active');
			}
		}

		setCurrPage(currPage);
	}

	//获取当前页数
	function getCurrPage() {
		return parseInt($('#page_curr').text());
	}

	//设置当前页数
	function setCurrPage(page) {
		$('#page_curr').text(page);
	}

	function setText(id, page) {
		$('#page' + id).text(page);
	}

	//设置页数显示
	function setPages(currPage) {
		if(currPage <= 3) {
			//当前在前3页，则显示1-5页
			for(var i = 1; i <= 5; i++) {
				setText(i, i);
			}
		} else if(currPage > (pageNum - 2)) {
			//当前页在后两页，始终显示后5页的索引
			for(var i = 1; i <= 5; i++) {
				setText(i, pageNum - 5 + i);
			}
		} else {
			//当前页在中间，显示当前页及前后两页
			for(var i = 1; i <= 5; i++) {
				setText(i, currPage - 3 + i)
			}
		}
	}

	//设置总页数
	function setPageNum(num) {
		pageNum = num;
	}
	
	//设置数据总条数
	function setCount(count){
		pageNum = getPageNum(count);
		//设置页码显示、隐藏状态
		sumOfShows = 1;
		if(pageNum > 5){
			sumOfShows = 5;
		}else{
			sumOfShows = pageNum;
		}
		for(var index = 1; index <= sumOfShows; index++){
			$('#page' + index).show();
		}
		for(var index = sumOfShows+1; index <= 5; index++){
			$('#page' + index).hide();
		}
	}
	
	//设置每页数据条数
	function setPerNum(num){
		perNum = num;
	}

	//根据数据条数，计算页面页数
	function getPageNum(count) {
		if(count % perNum == 0) {
			return parseInt(count / perNum)
		} else {
			return parseInt(count / perNum) + 1
		}
	}

	window.PageIndicator = {
		setPage: setPage,
		setCallback: setCallback,
		setPageNum: setPageNum,
		setCount: setCount,
		setPerNum: setPerNum
	}
}());