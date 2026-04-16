import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, contextFiles } = await req.json();
    
    // Kunci API "sayabutuhapi" hasil copy-paste langsung! 🔥
    const apiKey = "AIzaSyAGxzlw5TT4zWBeonBCEmsGzYfiz2wr3b4"; 
    
    // LANGKAH 1: RADAR OTOMATIS MENCARI MODEL
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listData = await listRes.json();

    if (!listRes.ok) throw new Error("Gagal cek model: " + JSON.stringify(listData));

    // Cari model Gemini pertama yang aktif di akun Anda
    const validModel = listData.models.find((m: any) => 
      m.name.includes("gemini") && m.supportedGenerationMethods.includes("generateContent")
    );

    if (!validModel) {
       const availableModels = listData.models.map((m: any) => m.name).join(", ");
       return NextResponse.json({ text: "Waduh, tidak ada model Gemini yang aktif. Model yang ada: " + availableModels }, { status: 500 });
    }

    // Nama model asli yang ditemukan radar (misal: "models/gemini-1.0-pro")
    const exactModelName = validModel.name;

    // LANGKAH 2: EKSEKUSI CHAT KE MODEL YANG DITEMUKAN
    const promptText = `
      Anda adalah Pstar9 AI, asisten cerdas untuk sistem manajemen file Karang Taruna Soko Mandiri. 
      Konteks file di Drive saat ini: [${contextFiles}].
      Jawablah pesan user berikut dengan ramah dan santai namun tetap profesional.
      Pesan User: "${message}"
    `;

    // Tembak URL menggunakan nama model yang lolos deteksi tadi
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${exactModelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Ditolak server saat generate pesan");
    }

    const aiText = data.candidates[0].content.parts[0].text;
    
    return NextResponse.json({ text: aiText });

  } catch (error: any) {
    console.error("Auto Fetch Error:", error);
    return NextResponse.json({ 
      text: "Sistem Error: " + error.message 
    }, { status: 500 });
  }
}