'use strict';
var fs = require('fs');
var buf = new Buffer(1024*1024);

var LCT = function(option){
	this._para = option.para;
	this._name = option.name;
	this._res  = option.res;
	this._path = option.name;
	this._api_manage_id = option.api_manage_id ? option.api_manage_id : "";
	if(!option.name) {
	    throw new Error('表明不能为空');
	}

	//将name首字母设置为大写
	this._name = this._name.slice(0, 1).toUpperCase()+this._name.slice(1);

	//将para解析成data
	var para = JSON.parse(this._para);
	var data = {};
	var number = [];
	for(var i = 0; i < para.length; i++){
		if(para[i].para_must){
			var value = para[i].para_name ? para[i].para_name : para[i].para_name
			data[para[i].para_name] = value;
		}else{
			data[para[i].para_name] = '';
		}

		if(para[i].para_number){
			number.push(para[i].para_name);
		}
	}
	this._data  = data;
	this._number  = number;
	console.log(this._path);
}
LCT.prototype = {
	buildApp:function(){
		var that = this;
		fs.open('app.js', 'r+', function(err, fd) {
		   if (err) {
		       return console.error(err);
		   }
		   fs.read(fd, buf, 0, buf.length, 0, function(err, bytes){
		      if (err){
		         console.log(err);
		      }

		      // 仅输出读取的字节
		      if(bytes > 0){
		         // console.log(buf.slice(0, bytes).toString());
		        var filetext = buf.slice(0, bytes).toString();
		        filetext = filetext.replace("app.use('/"+that._path+"', require('./routes/"+that._path+"'));\n","");
		        filetext = filetext.replace("//用户添加路由","//用户添加路由\napp.use('/"+that._path+"', require('./routes/"+that._path+"'));");
		        filetext = filetext.replace("//设置跨域访问","//设置跨域访问\napp.all('/"+that._path+"/*', requireAuthentication);");
		        fs.writeFile('app.js',filetext,  function(err) {
		           if (err) {
		               return console.error(err);
		           }
		           var result = {
		           		code : 200,
                    	message : "保存成功",
                    	data : []
		           }
		           that._res.send(result);
		        });
		      }

		      // 关闭文件
		      fs.close(fd, function(err){
		         if (err){
		            console.log(err);
		         }
		         console.log("文件关闭成功");
		      });
		   });
		});
	},
	build:function(){
		//生成文件
		var buildText = '';

		buildText = "'use strict';\n"+
					"var router = require('express').Router();\n"+
					"var AV = require('leanengine');\n"+
					"var AS = require('api-send');\n"+
					"AS.config.APPID = '"+this._api_manage_id+"';\n"+
					"AS.config.HOST = 'http://localhost:3000';\n\n"+
					"function sendError(res,code,message){\n"+
					"	var result = {\n"+
					"		code:code,\n"+
					"		message:message,\n"+
					"		data:[]\n"+
					"	}\n"+
					"	res.send(result);\n"+
					"}\n\n"+
					"function validate(res,req,data){\n"+
						"if(AS.config.APPID && !AS.add(req,data)){\n"+
							"res.send('true');\n"+
							"return;\n"+
						"}\n"+
    				"	for(var i in data){\n"+
        			"		if(req.method == 'GET'){\n"+
            		"			var value = req.query[i];\n"+
        			"		}else{\n"+
            		"			var value = req.body[i];\n"+
        			"		}\n"+
        			"		if(data[i]){\n"+
            		"			//必须值\n"+
            		"			if(!value){\n"+
                	"				var result = {\n"+
                    "					code : '302',\n"+
                    "					message : '缺少'+data[i],\n"+
                    "					data : []\n"+
                	"				}\n"+
                	"				res.send(result);\n"+
                	"				return '';\n"+
            		"			}\n"+
        			"		}\n"+
        			"		data[i] = value;\n"+
    				"	}\n"+
    				"	return data;\n"+
					"}\n\n";

		//创建
		buildText+=	"var "+this._name+" = AV.Object.extend('"+this._name+"');\n\n";

		//新增
		buildText+=	"// 新增\n"+
					"router.post('/add', function(req, res, next) {\n"+
					"	var data = "+JSON.stringify(this._data)+";\n"+
				    "	var data = validate(res,req,data);\n"+
    				"	if(!data){\n"+
        			"		return;\n"+
    				"	}\n"+
    				"	//强制转换Number型\n"+
    				"	var number = "+JSON.stringify(this._number)+";\n"+
    				"	for(var i = 0; i < number.length; i++){\n"+
    				"		var name = number[i];\n"+
    				"		data[name] = isNaN(Number(data[name])) ? 0 : Number(data[name]);\n"+
    				"	}\n"+
				    "	//创建应用\n"+
				    "	var addObj = new "+this._name+"();\n"+
				    "	for(var key in data){\n"+
                	"		addObj.set(key,data[key]);\n"+
            		"	}\n"+
				    "	addObj.save().then(function (addResult) {\n"+
					"		var result = {\n"+
					"			code : 200,\n"+
					"			data : addResult,\n"+
					"			message : '保存成功'\n"+
					"		}\n"+
					"		res.send(result);\n"+
					"	}, function (error) {\n"+
					"		var result = {\n"+
					"			code : 500,\n"+
					"			message : '保存出错'\n"+
					"		}\n"+
					"		res.send(result);\n"+
					"	});\n"+
					"})\n\n";
		//删除
		buildText+=	"// 删除\n"+
					"router.get('/delete', function(req, res, next) {\n"+
					"	var data = {\n"+
					"		id  : 'id'\n"+
				    "    }\n"+
				    "	var data = validate(res,req,data);\n"+
    				"	if(!data){\n"+
        			"		return;\n"+
    				"	}\n"+
    				"	var delObj = AV.Object.createWithoutData('"+this._name+"', data.id);\n"+
    				"	delObj.destroy().then(function (success) {\n"+
				    "		// 删除成功\n"+
				    "		var result = {\n"+
					"		   	code : 200,\n"+
					"		   	data : [],\n"+
					"		    message : '删除成功'\n"+
					"		}\n"+
					"		res.send(result);\n"+
				  	"	}, function(error) {\n"+
					"		res.send(error);\n"+
					"	}).catch(next);\n"+
					"})\n\n";
		//编辑
		buildText+=	"// 编辑\n"+
					"router.post('/edit', function(req, res, next) {\n"+
					"	var data = "+JSON.stringify(this._data)+";\n"+
					"	data.id = 'id';\n"+
				    "	var data = validate(res,req,data);\n"+
    				"	if(!data){\n"+
        			"		return;\n"+
    				"	}\n"+
				    "	var editObj = AV.Object.createWithoutData('"+this._name+"', data.id);\n"+
				    "	for(var key in data){\n"+
                	"		editObj.set(key,data[key]);\n"+
            		"	}\n"+
				    "	editObj.save().then(function (editResult) {\n"+
					"		var result = {\n"+
					"		    code : 200,\n"+
					"		    data : editResult,\n"+
					"		    message : '更改成功'\n"+
					"		}\n"+
					"		res.send(result);\n"+
					"	}, function (error) {\n"+
					"		var result = {\n"+
					"		    code : 500,\n"+
					"		    message : '保存出错'\n"+
					"		}\n"+
					"		res.send(result);\n"+
					"	}).catch(next);\n"+
					"})\n\n";
		//查找
		buildText+=	"// 查找\n"+
					"router.get('/list', function(req, res, next) {\n"+
					"	var data = {\n"+
					"		limit : '',\n"+
					"		skip  : '',\n"+
					"		asc   : '',\n"+
					"		desc  : ''\n"+
				    "    }\n"+
				    "	var data = validate(res,req,data);\n"+
    				"	if(!data){\n"+
        			"		return;\n"+
    				"	}\n"+
    				"	var limit = data.limit ? data.limit : 1000;\n"+
    				"	var skip  = data.skip ? data.skip : 0;\n"+
    				"	var query = new AV.Query('"+this._name+"');\n"+
    				"	query.skip(skip);\n"+
    				"	query.limit(limit);\n"+
    				"	if(data.asc){\n"+
    				"		query.ascending(data.asc);\n"+
    				"	}\n"+
    				"	if(data.desc){\n"+
    				"		query.descending(data.desc);\n"+
    				"	}\n"+
    				"	for(var i in req.query){\n"+
        			"		if(i == 'skip' || i == 'limit' || i == 'asc' || i == 'desc'){\n"+
        			"			continue;\n"+
        			"		}\n"+
        			"		if(req.query[i].type && req.query[i].value){\n"+
        			"			var type = isNaN(req.query[i].type) ? 9 : Number(req.query[i].type);\n"+
        			"			//强制转换Number型\n"+
    				"			var number = "+JSON.stringify(this._number)+";\n"+
    				"			var isNum = false;\n"+
    				"			for(var j = 0; j < number.length; j++){\n"+
    				"				if(number[j] == i)\n"+
    				"				isNum = true;\n"+
    				"			}\n"+
    				"			if(isNum){\n"+
    				"				var value = isNaN(Number(req.query[i].value)) ? 0 : Number(req.query[i].value);\n"+
    				"			}else{\n"+
    				"				var value = req.query[i].value;\n"+
    				"			}\n"+
        			"			switch(type){\n"+
        			"				case 1: query.equalTo(i, value);\n"+
        			"						break;\n"+
        			"				case 2: query.notEqualTo(i, value);\n"+
        			"						break;\n"+
        			"				case 3: query.greaterThan(i, value);\n"+
        			"						break;\n"+
        			"				case 4: query.greaterThanOrEqualTo(i, value);\n"+
        			"						break;\n"+
        			"				case 5: query.lessThan(i, value);\n"+
        			"						break;\n"+
        			"				case 6: query.lessThanOrEqualTo(i, value);\n"+
        			"						break;\n"+
        			"				case 7: query.startsWith(i, value);\n"+
        			"						break;\n"+
        			"				case 8: query.contains(i, value);\n"+
        			"						break;\n"+
        			"				case 0: query.exists(i);\n"+
        			"						break;\n"+
        			"				default: break;\n"+
        			"			}\n"+
        			"		}\n"+
    				"	}\n"+
    				"	query.find().then(function (results) {\n"+
				    "		// 查询成功\n"+
				    "		var result = {\n"+
					"		   	code : 200,\n"+
					"		   	data : results,\n"+
					"		    message : '获取成功'\n"+
					"		}\n"+
					"		res.send(result);\n"+
				  	"	}, function(err) {\n"+
					"		if (err.code === 101) {\n"+
      				"			//判断是否存在\n"+
        			"			var result = {\n"+
            		"				code : 200,\n"+
            		"				data : [],\n"+
            		"				message : 'success'\n"+
        			"			}\n"+
        			"			res.send(result);\n"+
	    			"		} else {\n"+
	     		 	"			next(err);\n"+
	    			"		}\n"+
					"	}).catch(next);\n"+
					"})\n\n";
		//详情
		buildText+=	"// 详情\n"+
					"router.get('/detail', function(req, res, next) {\n"+
					"	var data = {\n"+
					"		id  : 'id'\n"+
				    "    }\n"+
				    "	var data = validate(res,req,data);\n"+
    				"	if(!data){\n"+
        			"		return;\n"+
    				"	}\n"+
    				"	var query = new AV.Query('"+this._name+"');\n"+
    				"	query.get(data.id).then(function(results){\n"+
				    "		// 删除成功\n"+
				    "		var result = {\n"+
					"		   	code : 200,\n"+
					"		   	data : results,\n"+
					"		    message : '获取成功'\n"+
					"		}\n"+
					"		res.send(result);\n"+
				  	"	}, function(error) {\n"+
					"		res.send(error);\n"+
					"	}).catch(next);\n"+
					"})\n\n";

		buildText+= "if(AS.config.APPID)\n"+
								"AS.build('/"+this._path+"',router);\n"+
								"module.exports = router;";

		var that = this;
		//生成文件
		fs.writeFile("routes/"+this._path+".js", buildText, function(){
            that.buildApp();
        });
	}
}

module.exports = LCT;
