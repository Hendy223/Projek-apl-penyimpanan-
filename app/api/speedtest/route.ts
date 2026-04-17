import { NextResponse } from "next/server";

// Mengatur GET Request (Untuk Ping & Download Test)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  // 1. Jalur Ping: Hanya mengembalikan respon string kecil secepat mungkin
  if (searchParams.get('ping')) {
    return NextResponse.json({ message: "pong" });
  }

  // 2. Jalur Download: Mengirimkan file dummy sebesar 5MB ke browser
  if (searchParams.get('download')) {
    const sizeInBytes = 5 * 1024 * 1024; // 5 MB Data
    const dummyBuffer = new Uint8Array(sizeInBytes); 
    
    return new NextResponse(dummyBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': sizeInBytes.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate', // Jangan di-cache agar testnya akurat
      },
    });
  }

  return NextResponse.json({ error: "Parameter tidak valid" }, { status: 400 });
}

// Mengatur POST Request (Untuk Upload Test)
export async function POST(req: Request) {
  try {
    // Browser akan mengirim file dummy, kita hanya perlu menerimanya untuk mengukur waktu
    const blob = await req.blob();
    return NextResponse.json({ success: true, uploadedBytes: blob.size });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}