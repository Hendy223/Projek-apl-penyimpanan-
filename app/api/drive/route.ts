import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';

export async function GET() {
  try {
    // 1. Mencari lokasi file kunci JSON Pstar9
    const jsonPath = path.join(process.cwd(), 'pstar9-kunci.json');
    
    // 2. Mengaktifkan otorisasi menggunakan robot Pstar9
    const auth = new google.auth.GoogleAuth({
      keyFile: jsonPath,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // 3. ID Folder Google Drive target
    const folderId = '1xknch7NKi0NCDGo1jPA7xkb4rHlV-sJE'; 

    // 4. Meminta daftar file dari Google Drive
    // Saya menambahkan 'thumbnailLink' agar nanti gambar bisa ditampilkan sebagai preview di web
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, webContentLink, thumbnailLink)', 
    });

    // 5. Mengirimkan data file ke web Pstar9 (Frontend)
    return NextResponse.json({ 
      success: true, 
      files: response.data.files 
    });

  } catch (error) {
    console.error('Error Koneksi Pstar9:', error);
    return NextResponse.json(
      { success: false, message: 'Pstar9 gagal membaca isi Google Drive.' }, 
      { status: 500 }
    );
  }
}