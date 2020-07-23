const puppeteer = require('puppeteer');
const cheerio = require('cheerio')
const request = require('request')
const fs = require('fs')
const path = require('path')
// let css = new Set();
// let js = new Set();
let html = new Set();
// let img = new Set();

html.add('index.html');

async function getHtml(url){
    const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto(url,{
        timeout: 0
    });

	// Get the "viewport" of the page, as reported by the page.
	const res = await page.evaluate(() => {
		return {
            info: document.documentElement.innerHTML,
		};
	});
	// console.log('res:', res);
    await browser.close();
    return res;
}

//  写入文件
async function writeFile(value, type='text'){
    console.log('----write----',value)
    const diretory = '/result';
    const prevUrl = 'https://openucx.github.io/ucx/api/latest/html/';
    
    try{
        fs.statSync(path.join(__dirname, diretory))
    }catch(e){
        const diretoryPath = path.join(__dirname, diretory)
        fs.mkdirSync(diretoryPath);
        fs.mkdirSync(`${diretoryPath}/search`);
    }
    // if(!fs.statSync(path.join(__dirname, diretory)).isDirectory()){
    
    // }
    const filePath = path.join(__dirname, `${diretory}/${value}`)
    if(type === 'text'){
        fs.access(filePath, (err) => {
            if (err) {
                const downloadUrl = `${prevUrl}${value}`;
                console.log(downloadUrl)
                request(downloadUrl, function (error, response, body) {
                    if(error){
                        return console.error(error);
                    }
                    if (response.statusCode == 200) {
                        fs.writeFile(filePath, body,  function(err) {
                            if (err) {
                                return console.error(err);
                            }
                            console.log(filePath + "文本写入成功！");
                            console.log("--------我是分割线-------------")
                        });
                    }
                    
                    
                })
                console.log(err.message);
            } else {
                console.log('existed');
            }
        })
    }else if(type === 'img'){
        fs.access(filePath, (err) => {
            if (err) {
                const downloadUrl = `${prevUrl}${value}`;
                console.log(downloadUrl)
                request(downloadUrl).pipe(fs.createWriteStream(filePath));
                console.log(err.message);
            } else {
                console.log('existed');
            }
        })
      
        // if(!fs.statSync(filePath).isFile()){
          
        // }
    }
    return;
}

// 处理html，得到js、css、html
async function getStatic(value){
    const prevUrl = 'https://openucx.github.io/ucx/api/latest/html/'
    const url = prevUrl + value
    
    const response = await getHtml(url);
    const $ = cheerio.load(response.info)
    
    const htmlPrevCount = html.size; 
    let htmlNowCount;
    // css.add($('link').href);
    // js.add($('script').src);
    $("[href$='.css']").each(function(){
        const cssUrl = $(this).attr('href')
        writeFile(cssUrl)
        // css.add(cssUrl)
    })
    $("[src$='.js']").each(function(){
        const jsUrl = $(this).attr('src')
        writeFile(jsUrl)
        // js.add(jsUrl)
    })
    $("[href$='.html']").each(function(){
        const htmlUrl = $(this).attr('href')
        if(htmlUrl === `http://www.doxygen.org/index.html`){
            return;
        }
        // 对一些漏掉的js进行补全
        const jsUrl = htmlUrl.split('html')[0] + 'js'
        
        writeFile(jsUrl)
        // 访问并写入写入
        writeFile(htmlUrl)
        html.add(htmlUrl)
        htmlNowCount = html.size;
        console.log('count', htmlNowCount)
        if(htmlNowCount === htmlPrevCount){
            return;
        }else{
            getStatic($(this).attr('href'))
        }
    })
    $("[src$='.png']").each(function(){
        const imgUrl = $(this).attr('src')
        writeFile(imgUrl,'img')
        // img.add(imgUrl)
    })
    // 一些在css中的图片
    writeFile('tab_a.png','img')
    writeFile('tab_b.png','img')
    writeFile('tab_s.png','img')
    writeFile('search_l.png','img')
    writeFile('search_m.png','img')
    writeFile('search_r.png','img')
    if(htmlNowCount === htmlPrevCount){
        return;
    }else{
        getStatic($(this).attr('href'))
    }
} 

//  搜索栏特殊处理
function getSearchStatic(){
    const search = ['all','class','functions','variables','typedefs','enums','enumvalues','groups','pages']
    search.forEach(item => {
        for(let i = 0; i< 15; i++){
            const jsUrl = `search/${item}_${i}.js`
            const htmlUrl = `search/${item}_${i}.html`
            // 写入
            writeFile(jsUrl)
            writeFile(htmlUrl)
        }
    })
    // 搜索不到时的页面
    const htmlUrl = `search/nomatches.html`
    writeFile(htmlUrl)
} 

//  主函数
function main() {
    const index = 'index.html'
    getStatic(index)
    getSearchStatic()
    return;
}

// 运行
(async() => {
    try {
        main();
    } catch(error){
        console.log(error);
    }
})();


