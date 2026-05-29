const fs = require("fs");
const https = require("https");
const zlib = require("zlib");

// 读取cookies
const cookiesData = JSON.parse(fs.readFileSync("/home/node/.openclaw/workspace/douyin_cookies.json", "utf8"));
const cookies = cookiesData.cookies;
const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join("; ");

// 检查评论区页面
const checkCommentPage = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: "creator.douyin.com",
      path: "/creator-micro/interactive/comment",
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Cookie": cookieString,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0"
      }
    };
    
    const req = https.request(options, (res) => {
      let data = [];
      res.on("data", (chunk) => {
        data.push(chunk);
      });
      
      res.on("end", () => {
        const buffer = Buffer.concat(data);
        
        let decompressedData;
        const encoding = res.headers["content-encoding"];
        
        if (encoding === "gzip") {
          decompressedData = zlib.gunzipSync(buffer);
        } else if (encoding === "deflate") {
          decompressedData = zlib.inflateSync(buffer);
        } else if (encoding === "br") {
          decompressedData = zlib.brotliDecompressSync(buffer);
        } else {
          decompressedData = buffer;
        }
        
        const html = decompressedData.toString();
        
        resolve({
          statusCode: res.statusCode,
          hasCommentSection: /评论/.test(html),
          hasCommentItems: /comment-item/.test(html)
        });
      });
    });
    
    req.on("error", (err) => {
      console.error("访问评论区页面失败:", err.message);
      resolve(null);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(null);
    });
    
    req.end();
  });
};

// 执行检查
checkCommentPage()
  .then((result) => {
    if (result === null) {
      console.log("无法访问评论区页面");
    } else {
      console.log(`是否有新评论: ${result.hasCommentSection}`);
      console.log(`评论数量: ${result.hasCommentItems ? "大于0" : "0"}`);
    }
  })
  .catch((error) => {
    console.error("检查失败:", error.message);
  });
