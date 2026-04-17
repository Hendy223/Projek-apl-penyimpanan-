import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST(req: Request) {
  try {
    const { ip } = await req.json();

    // 1. Validasi ketat format IP untuk mencegah Hacker (Command Injection)
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ip || !ipRegex.test(ip)) {
      return NextResponse.json({ success: false, message: 'Format IP tidak valid' }, { status: 400 });
    }

    // 2. Sesuaikan perintah Ping untuk Windows atau Linux/Mac
    const isWindows = process.platform === 'win32';
    // Kirim 1 paket ping, timeout 1 detik
    const cmd = isWindows ? `ping -n 1 -w 1000 ${ip}` : `ping -c 1 -W 1 ${ip}`;

    try {
      const { stdout } = await execPromise(cmd);
      
      // 3. Ekstrak milidetik (ms) dari teks hasil ping
      let time = '0';
      if (isWindows) {
        const match = stdout.match(/time[=<](\d+)ms/i);
        if (match) time = match[1];
      } else {
        const match = stdout.match(/time=([\d.]+) ms/i);
        if (match) time = match[1];
      }
      
      return NextResponse.json({ success: true, ip, time: `${time}ms`, status: 'Online' });
    } catch (cmdErr) {
      // Jika ping gagal/timeout, akan masuk ke catch ini
      return NextResponse.json({ success: true, ip, time: 'Timeout', status: 'Offline' });
    }

  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Internal Error' }, { status: 500 });
  }
}