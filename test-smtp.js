const net = require('net');

function testSmtpConnection() {
  return new Promise((resolve, reject) => {
    const client = net.createConnection({
      host: 'smtp.163.com',
      port: 25
    }, () => {
      console.log('连接成功');
      resolve(client);
    });

    client.on('data', (data) => {
      console.log('服务器响应:', data.toString());
    });

    client.on('error', (err) => {
      console.error('连接失败:', err);
      reject(err);
    });

    client.on('end', () => {
      console.log('连接结束');
    });

    // 超时设置
    setTimeout(() => {
      client.destroy();
      reject(new Error('连接超时'));
    }, 5000);
  });
}

async function test() {
  try {
    console.log('正在连接到smtp.163.com:25...');
    const client = await testSmtpConnection();
    
    // 发送HELO命令
    client.write('HELO localhost\r\n');
    
    // 等待响应
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 关闭连接
    client.write('QUIT\r\n');
    await new Promise(resolve => setTimeout(resolve, 1000));
    client.end();
    
    console.log('测试完成');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

test().catch(error => {
  console.error('测试失败:', error);
});
