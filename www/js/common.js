var API_URL = "http://10.0.17.110:8080/emm_backend/v1";
var XIAO_URL = "http://218.247.15.103/hxlife/interface/api/v1"; 
var PRODUCT_URL = "http://218.247.15.103/hxlife/greeniInterface/api/v1/channel/";
var WEATHER_URL = "http://218.247.15.103:8080/weatherinterface/";
var storage = window.localStorage;
//登录
function loginFun ($scope,$http,$state,user){
   if("" == user.userName||"" == user.password){
      $ionicPopup.alert({
         title: '登录失败',
         template: '用户名或密码不能为空'
      });
   }else{
      var successPopup = $ionicPopup.show({ 
        content:'loading...'
      });
      $http.post(API_URL+"/mslifeLogin.json",{"agentCode":user.userName,"password":user.password,"clientType":'04'})
      .success(function( obj ){
        if(0 == obj.status.code){
            var myData = obj.data;
            var jsonLogin ={
               "databaseName":"UserDatabase",
               "tableName": "current_user_info",
               "conditions": [{"id": user.userName}],
               "data": [
                        {
                          "id": user.userName,
                          "name": myData.agentName,
                          "loginName": myData.agentName,
                          "password": user.password,
                          "icon": "",
                          "flag": "",
                          "score": "",
                          "lastLoginTime": "",
                          "seriesLoginCount": "",
                          "phone": myData.phone,
                          "position": "",
                          "landline": ""
                        }
                    ]
               };
               updateORInsertTableDataByConditions (jsonLogin,function(str){
                    if(1 == str[0]){
                        storage.setItem("name",myData.agentName);
                        storage.setItem("userName",user.userName);
                        storage.setItem("password",user.password);
                        storage.setItem("phone",myData.phone);
                        $state.go('app.home_page');
                        successPopup.close();
                    }
                },function (){
                    console.log("登录失败！")
                })
            
           }     
      })
      .error(function(){
        console.log("网络连接错误");
      }) 
    }
 }
//查询应用详情
function loadAppInfo($scope,$http,appId){
   $http.get(API_URL+'/appStore.json?appId='+appId)
   .success(function( obj ){
       if(0 == obj.status.code){
            $scope.objData = obj.data;
        }
    })
    .error(function(){
           console.log("网络连接错误");
    })
}
//查询应用
function loadApp($scope,$http,$compile){
  if(navigator.onLine){//检测当前设备是否有网 如果有网查询服务器
    var modelType = platform == 'pad'?'2':'1';
    var osId = '1';
    if(brows().android){
        osId = 2;   
    }
    //查询所有应用
    $http.get(API_URL+'/appStore/getList.json?modelType='+modelType+'&osId='+osId)
    .success(function( obj ){
      if(0 == obj.status.code){
        var data = obj.dataList;
        $scope.all_app = data;
        checkApp(0,data,"",$scope,$compile);
      }
    })
    .error(function(){
      console.log("网络连接错误");
    })
  }else{//否则查询本地
    var appStr = "";
    var json = {
        "databaseName":"AppDatabase",
        "tableName": "app_info"
    };
    queryAllTableData(json,function(data){
      if（data.length >0）{
         $scope.all_app = data;
          for(var i =0; i<data.length ;i++){
            var picSrc = data[i].icon?obj.icon:'img/show.png';
            appStr+="<a ng-click='downloadOrUpdate("+i+")'><li><dl><dt><img src='"+picSrc+"' /></dt><dd><span>"+obj.appName+"</span></dd></dl></li><input type='hidden' id='"+obj.appId+"state' value='3'></a>";
          }
        var txt = $compile(appStr)($scope);
        var el = document.getElementById("app_list_ul");
        angular.element(el).html('').append(txt);
      }
    },function （）{
      console.log('查询本地失败！');
    });
  } 
}
//判断app的状态
function checkApp(i,d,appStr,$scope,$compile){
  var obj = d[i];
  var flag = obj.flag;
  var json = {
      "databaseName":"AppDatabase",
      "tableName": "app_info",
      "conditions": {"appId":obj.appId}
  };
  queryTableDataByConditions(json,function(data){
    var picSrc = obj.icon?obj.icon:'img/show.png';
    if('3' == flag){//已经关闭的 删除本地数据以及文件
        if(data.length>0){
           appStr+="<a ng-click='deleteApp("+i+")'><li><dl><dt><img src='"+picSrc+"' /></dt><dd><span>"+obj.appName+"</span></dd></dl></li><li  class='new_app'><span>删除应用</span></li>"; 
        }
    }else{
      if(data.length>0){
          if(obj.versionId == data[0].versionId){//直接打开状态
              appStr+="<a ng-click='downloadOrUpdate("+i+")'><li><dl><dt><img src='"+picSrc+"' /></dt><dd><span>"+obj.appName+"</span></dd></dl></li><input type='hidden' id='"+obj.appId+"state' value='3'></a>";
          }else{//更新状态
              appStr+="<a ng-click='downloadOrUpdate("+i+")'><li><dl><dt><img src='"+picSrc+"' /></dt><dd><span>"+obj.appName+"</span></dd></dl></li><input type='hidden' id='"+obj.appId+"state' value='2'><li id='"+obj.appId+"li' class='new_app'><span>开始更新</span></li></a>";
          }
      }else{//下载状态
        appStr+="<a ng-click='downloadOrUpdate("+i+")'><li><dl><dt><img src='"+picSrc+"' /></dt><dd><span>"+obj.appName+"</span></dd></dl></li><li id='"+obj.appId+"li' class='new_app'><span>开始下载</span></li><input type='hidden' id='"+obj.appId+"state' value='1'>";
      }
    }  
    if(i < d.length-1){
        i++;
        checkApp(i,d,appStr,$scope,$compile);
    }else{
        var txt = $compile(appStr)($scope);
        var el = document.getElementById("app_list_ul");
        angular.element(el).html('').append(txt);
        appStr = "";
        i == 0;
    }
  },function (){
    console.log("本地查询出错！")
  });
}
//打开单频道应用
function openNativeApp(appid){
  //根据频道ID查询菜单
  var serviceType = "LOCAL";
  var url = "promodel/"+appid+"/www/index.html#"+appid;
  var menuJson ={
      "databaseName":"AppDatabase",
      "tableName": "app_menu",
      "conditions": {
          "cmsmanage_channel_id":appid
        }
  };
  var jsonKey ={
      "serviceType":serviceType,
      "URL": url
  };
  pushToViewController(jsonKey, function (){
    console.log("成功！")
  },function (){
    console.log("失败！")
  })
}
//下载应用
function downloadApp($scope,$http){
  var jsonApp ={
    "databaseName":"AppDatabase",
    "tableName": "app_info",
    "conditions":[{"appId": $scope.objData.appId}],
    "data": [
       {
       "appId": $scope.objData.appId,
       "appsourceid": $scope.objData.appsourceid,
       "appstoreid": $scope.objData.appstoreid,
       "company": $scope.objData.company,
       "description": $scope.objData.description,
       "icon":$scope.objData.icon,
       "iconInfo":$scope.objData.iconInfo,
       "versionDescription":$scope.objData.versionDescription,
       "name": $scope.objData.appName,
       "pkgname": $scope.objData.pkgname,
       "fullTrialText": $scope.objData.fullTrialText,
       "version":$scope.objData.version,
       "versionId":$scope.objData.versionId,
       "ipaUrl": $scope.objData.ipaUrl,
       "full_trial_id": $scope.objData.full_trial_id,
       "version_type": $scope.objData.version_type,
       "schemesUrl": $scope.objData.schemesUrl,
       "service_type": $scope.objData.codeStyleText,
       "createTime":$scope.objData.createTime,
       "appSize":$scope.objData.appSize,
       "plistUrl":$scope.objData.plistUrl
       }
    ]
  };
  //向本地库添加数据
  updateORInsertTableDataByConditions (jsonApp,function(str){
    if(1 == str[0]){ //数据插入成功
      if('NATIVE' == $scope.objData.codeStyleText){
        var downloadUrl = "";
        if(brows().android){
          downloadUrl = $scope.objData.ipaUrl;
        }else{
          downloadUrl = $scope.objData.plistUrl;
        }
        var appKye ={'appList':downloadUrl};
        downloadNavtiveApp(appKye,function (str){
          if('1' == str[0]){
            console.log("原生应用下载成功！")
            document.getElementById($scope.objData.appId+"state").value = "3";
            document.getElementById($scope.objData.appId+"li").style.display= 'none';
          }
        },function (){
          console.log("原生应用下载失败！")
        })
      }else if('SERVICE' == $scope.objData.codeStyleText){
        console.log('我是服务！');
        document.getElementById($scope.objData.appId+"state").value = "3";
        document.getElementById($scope.objData.appId+"li").style.display= 'none';
      }else{//单应用
        //下载应用包
        var modelJson = {
          "package":"promodel/"+$scope.objData.appId,
          "url":$scope.objData.ipaUrl
        }
        downloadZip(modelJson,function (){
          console.log("应用资源下载成功！");
          document.getElementById($scope.objData.appId+"state").value = "3";
          document.getElementById($scope.objData.appId+"li").style.display= 'none';
        },function (){
          console.log("应用资源下载出错！")
        });
      } 
    }else{
      console.log("数据插入失败！");
    }
  },function(){
    console.log("数据插入异常！");
  }); 
}
//删除应用
function deleteAppFun($scope,$http,$compile,$ionicPopup){
  var successPopup = $ionicPopup.show({ 
      content:'loading...'
  });
  var json ={
          "databaseName":"AppDatabase",
          "tableName": "app_info",
          "conditions":[{"appId": $scope.objData.appId}]
       };
  deleteTableData(json,function(str){
   if ('1' == str[0]) {
       if('NATIVE' != $scope.objData.codeStyleText){
           deleteFilePath("", function (){
               successPopup.close();
               alert("应用删除成功！");
               loadApp($scope,$http,$compile);
           }, function (){
              console.log('应用删除失败！');
           });
       }
    }else{
     alert("应用删除失败！");
    }
  },function(){
   alert("失败");
  });
}