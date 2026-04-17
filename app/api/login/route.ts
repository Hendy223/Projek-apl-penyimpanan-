import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    
    // Mengambil kredensial asli dari .env.local
    const validUser = process.env.ADMIN_USERNAME;
    const validPass = process.env.ADMIN_PASSWORD;

    // Cek apakah inputan cocok dengan brankas
    if (username === validUser && password === validPass) {
      return NextResponse.json({ success: true, message: "Login Berhasil" });
    } else {
      return NextResponse.json({ success: false, message: "Username atau Password salah!" }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: "Terjadi kesalahan sistem." }, { status: 500 });
  }
}