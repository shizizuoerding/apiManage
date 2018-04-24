'use strict';
var express = require('express');
var timeout = require('connect-timeout');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var AV = require('leanengine');
var classtb = require('./routes/classtb');
var grade = require('./routes/grade');
var anment = require('./routes/anment');
var btmovie = require('./routes/btmovie');
var jwcnew = require('./routes/jwcnew');
var xgnew = require('./routes/xgnew');
var indexnew = require('./routes/indexnew');
var jsjnew = require('./routes/jsjnew');
var foodnew = require('./routes/foodnew');
var dropbox = require('./routes/dropbox');
var jxpt = require('./routes/jxpt');
var advertise = require('./routes/advertise');
var LCT = require('lc-build');
var LCT = new LCT({
  path:"routes/user.js"
})
// LCT.buildUser();




// 加载云函数定义，你可以将云函数拆分到多个文件方便管理，但需要在主文件中加载它们
require('./cloud');

var app = express();

var requireAuthentication = function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
}

//设置跨域访问
app.all('/nihao_ceshi2/*', requireAuthentication);
app.all('/nihao_ceshi2/*', requireAuthentication);
app.all('/nihao_ceshi/*', requireAuthentication);
app.all('/nihao_user/*', requireAuthentication);
app.all('/bishe_user/*', requireAuthentication);
app.all('/app_ttt_su/*', requireAuthentication);
app.all('/test_app_grade/*', requireAuthentication);
app.all('/test_app_user/*', requireAuthentication);
app.all('/test_ceshi/*', requireAuthentication);
app.all('/test_ceshi/*', requireAuthentication);
app.all('/test_snake/*', requireAuthentication);
app.all('/test_snake/*', requireAuthentication);
app.all('/test_snake/*', requireAuthentication);
app.all('/test_snake/*', requireAuthentication);
app.all('/test_snake/*', requireAuthentication);
app.all('/test_snake/*', requireAuthentication);
app.all('/test_snake/*', requireAuthentication);
app.all('/test_snake/*', requireAuthentication);
app.all('/test_snake/*', requireAuthentication);
app.all('/app/*', requireAuthentication);
app.all('/api/*', requireAuthentication);

// 设置模板引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static('public'));

// 设置默认超时时间
app.use(timeout('15s'));

AV.init({
  appId: process.env.LEANCLOUD_APP_ID || 'CTTCadj1G6hJrLxVcuifndum-gzGzoHsz',
  appKey: process.env.LEANCLOUD_APP_KEY || 'mGpXUSvV5JOOARtDmzBubFhj',
  masterKey: process.env.LEANCLOUD_APP_MASTER_KEY || 'o2NRqFyi8vtLzxDA3EsALxK5'
});

// 加载云引擎中间件
app.use(AV.express());

app.enable('trust proxy');
// 需要重定向到 HTTPS 可去除下一行的注释。
// app.use(AV.Cloud.HttpsRedirect());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/', function(req, res) {
  var currentUser = AV.User.current();
  if(currentUser){
    console.log(currentUser["id"]);
  }
  
  res.render('index', { user: currentUser});
});

app.get('/login', function(req, res) {
  var currentUser = AV.User.current();
  if (currentUser) {
      // 跳转到首页
      res.redirect("/");
  }
  else {
    //currentUser 为空时，可打开用户注册界面…
    res.render('login');
  }
});

app.get('/signup', function(req, res) {
  var currentUser = AV.User.current();
  if (currentUser) {
      // 跳转到首页
      res.redirect("/");
  }
  else {
    //currentUser 为空时，可打开用户注册界面…
    res.render('signup');
  }
});

// 可以将一类的路由单独保存在一个文件中
app.use('/todos', require('./routes/todos'));
app.use('/app', require('./routes/app'));
app.use('/api', require('./routes/api'));
app.use('/user', require('./routes/user'));
app.use('/v1', require('./routes/v1'));

//用户添加路由
app.use('/nihao_ceshi2', require('./routes/nihao_ceshi2'));
app.use('/nihao_ceshi', require('./routes/nihao_ceshi'));
app.use('/nihao_user', require('./routes/nihao_user'));
app.use('/bishe_user', require('./routes/bishe_user'));
app.use('/app_ttt_su', require('./routes/app_ttt_su'));
app.use('/test_app_grade', require('./routes/test_app_grade'));
app.use('/test_app_user', require('./routes/test_app_user'));
app.use('/test_snake', require('./routes/test_snake'));
app.use('/test_car', require('./routes/test_car'));
app.use('/ceshi_add', require('./routes/ceshi_add'));
app.use('/test_test', require('./routes/test_test'));
app.use('/classtb', classtb);  //获取班级课表
app.use('/grade', grade);      //获取成绩
app.use('/anment', anment);    
app.use('/btmovie',btmovie);   //获取bt天堂最新电影
app.use('/jwcnew',jwcnew);     //获取教务处新闻
app.use('/xgnew',xgnew);       //获取学工网新闻
app.use('/indexnew',indexnew);  //获取官网首页新闻
app.use('/jsjnew',jsjnew);  //获取计算机学院官网新闻
app.use('/dropbox',dropbox);//获取网络存储
app.use('/foodnew',foodnew);//中华美食网美食信息
app.use('/jxpt',jxpt);//获取教学平台信息
app.use('/advertise',advertise);

app.use(function(req, res, next) {
  // 如果任何一个路由都没有返回响应，则抛出一个 404 异常给后续的异常处理器
  if (!res.headersSent) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  }
});

// error handlers
app.use(function(err, req, res, next) {
  if (req.timedout && req.headers.upgrade === 'websocket') {
    // 忽略 websocket 的超时
    return;
  }

  var statusCode = err.status || 500;
  if (statusCode === 500) {
    console.error(err.stack || err);
  }
  if (req.timedout) {
    console.error('请求超时: url=%s, timeout=%d, 请确认方法执行耗时很长，或没有正确的 response 回调。', req.originalUrl, err.timeout);
  }
  res.status(statusCode);
  // 默认不输出异常详情
  var error = {}
  if (app.get('env') === 'development') {
    // 如果是开发环境，则将异常堆栈输出到页面，方便开发调试
    error = err;
  }
  res.render('error', {
    message: err.message,
    error: error
  });
});

// app.use('/test_car', require('./routes/test_car'));
module.exports = app;
