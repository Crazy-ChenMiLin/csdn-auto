const { Client } = require('ssh2');

const config = {
  host: '146.56.102.26',
  port: 22,
  username: 'root',
  password: 'czqCZQ197623@',
  readyTimeout: 20000
};

function runCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let output = '';
      stream.on('close', () => resolve(output))
            .on('data', (data) => output += data)
            .stderr.on('data', (data) => output += data);
    });
  });
}

async function main() {
  const conn = new Client();
  
  console.log('🔌 连接服务器...');
  
  await new Promise((resolve, reject) => {
    conn.on('ready', resolve)
        .on('error', reject)
        .connect(config);
  });
  
  console.log('✅ 连接成功！\n');
  
  // 检查系统信息
  console.log('📊 系统信息:');
  const uname = await runCommand(conn, 'uname -a');
  console.log(uname);
  
  // 检查已安装软件
  console.log('\n📦 已安装软件:');
  const software = await runCommand(conn, 'which node python3 nginx docker pm2 2>/dev/null || echo "部分未安装"');
  console.log(software);
  
  // 检查内存和磁盘
  console.log('\n💾 系统资源:');
  const mem = await runCommand(conn, 'free -h | head -2');
  console.log(mem);
  const disk = await runCommand(conn, 'df -h | grep -E "^/dev" | head -3');
  console.log(disk);
  
  conn.end();
  console.log('\n👋 连接已关闭');
}

main().catch(err => {
  console.error('❌ 错误:', err.message);
  process.exit(1);
});
