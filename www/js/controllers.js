angular.module('starter.controllers', [])
//登录
<<<<<<< HEAD
.controller('LoginCtrl',function ($scope,$http,$state){
    $scope.user = {
=======
.controller('LoginCtrl',function ($scope,$http,$state,$timeout){
    $timeout(function(){
        currentDeviceModel("", function (obj){             
          if('pad' == obj){
            modelType = '2';
          }else{
            modelType = '1';
          }
        }, function (){
          console.log("获取设备失败！")
        })
    },500);
	$scope.user = {
>>>>>>> FETCH_HEAD
		'userName': "8611018517",
		'password': "195788"
	}
	//登录
	$scope.login =function (user){
		//loginFun ($scope,$http,$state,user);
        $state.go('app.home_page');
    }
})
//个人中心
.controller('PersonalCtrl', function($scope) {
    alert(modelType)
	$scope.name = storage.name ; 
    $scope.phone = storage.phone ; 	
})
//主页
.controller('HomePageCtrl', function($scope,$http,$compile,$interval,$ionicPopup) {
	//查询所有应用
	loadApp($scope,$http,$compile);
	//间隔
	$interval(function (){
		loadApp($scope,$http,$compile);
	},2000000);//大概33分钟执行一次
    //删除应用
    $scope.deleteApp = function (i){
        $scope.objData = $scope.all_app[i];
        deleteAppFun($scope,$http,$compile,$ionicPopup);
    }
	//更新、下载、打开
	$scope.downloadOrUpdate = function (i) {
        $scope.objData = $scope.all_app[i];
        var state = document.getElementById($scope.objData.appId+"state").value;
        if('1'==state || '2'==state){//下载、更新
            downloadApp($scope,$http);
        }else if('3'==state){//打开
        	if ('NATIVE' == $scope.objData.codeStyleText) {//打开原生应用
        		var openUrl = "";
        		if(brows().android){
        			openUrl = $scope.objData.pkgname ;
        		}else{
        			openUrl = $scope.objData.schemesUrl;
        		}
        		var j={
        			"userName":storage.userName,
        			"password":storage.password
        		}
        		openApp(openUrl,j,function (){
					console.log("原生应用打开成功！")
				},
				function (){
					console.log("打开原生应用失败！")
				});
        	}else if('WEBSERVICE' == $scope.objData.codeStyleText){//打开WEBSERVICE应用
        		openNativeApp($scope.objData.appId);
        	}else{//打开SERVICE
                alert("打不开的！")
        	}
        }else{//删除
            alert("删除应用！")
        }
	}
})
