var router = require('express').Router();
var AV = require('leanengine');
var cheerio = require('cheerio');
// var iconv = require('iconv-lite');
var http =  require('http');
var qs = require('querystring');
// var cookieParser = require('cookie-parser');
var request = require('request');
var charset = require('superagent-charset');
var superagent = require('superagent');
// charset(superagent);

// `AV.Object.extend` 方法一定要放在全局变量，否则会造成堆栈溢出。
// 详见： https://leancloud.cn/docs/js_guide.html#对象
// 新增 Todo 项目
router.post('/', function(req, res, next) {
  var content = req.body.content;
  var todo = new Todo();
  todo.set('content', content);
  todo.save(null, {
    success: function(todo) {
      res.redirect('/todos');
    },
    error: function(err) {
      next(err);
    }
  })
})
function sendErrorMessage(res,message){
  var result = {
    code:500,
    message:"加载失败"
  }
  res.send(result);
}
router.get('/indexNew', function(req, resp, next) {
  indexNew(resp);
});

function indexNew(resp) {
  var url = "http://www.cuit.edu.cn/";
  var code = 200;
  var message = "success";
  superagent.get(url)
    .charset("UTF-8")
    .end((err, res) => {
    	 if(!res){
        sendErrorMessage(resp);
        return ;
      }
        var $ = cheerio.load(res.text);
          var i = 0;
          var data1 = {};
          var data2 = {};
          var data3 = {};
          var data4 = {};
          var length;
          var j = 0;
          $("#New1 a").each(function(i,ele){
          var text  = $(this).text();
          var url  = "http://www.cuit.edu.cn/" + $(this).attr("href");
          data1[j] ={
            title : "综合新闻",
            text : text,
            url : url
          }
          j++;
          })
          length = j;
          data1 = {data1,length};
          var j = 0;
          $("#New2 a").each(function(i,ele){
          var text  = $(this).text();
          var url  = "http://www.cuit.edu.cn/" + $(this).attr("href");
          data2[j] ={
            title : "信息公告",
            text : text,
            url : url
          }
          j++;
          })
          length = j;
          data2 = {data2,length};
          var j = 0;
          $("#New4 a").each(function(i,ele){
          var text  = $(this).text();
          var url  = "http://www.cuit.edu.cn/" + $(this).attr("href");
          data3[j] ={
            title : "学术动态",
            text : text,
            url : url
          }
          j++;
          })
          length = j;
          data3 = {data3,length};
          var j = 0;
          $("#hlFocus").each(function(i,ele){
          var text  = $(this).text();
          var url  = "http://www.cuit.edu.cn/" + $(this).attr("href");
          data4[j] ={
            title : "焦点新闻",
            text : text,
            url : url
          }
          j++;
          })
          length = j;
          data4 = {data4,length};
          var datas = {code,message,data1,data2,data3,data4};
          console.log(datas);
        resp.send(datas);
    })
  }
  //去除前后空格
function leaveBlank(str){
  str = str.replace(/\s+/g,"");
  return str;
}

module.exports = router;