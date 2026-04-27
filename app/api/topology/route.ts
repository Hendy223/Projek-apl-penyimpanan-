import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Database sederhana akan disimpan di folder root project
const dbPath = path.join(process.cwd(), 'topology_db.json');

export async function GET() {
  try {
    if (!fs.existsSync(dbPath)) return NextResponse.json({ nodes: [], edges: [] });
    const data = fs.readFileSync(dbPath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (e) {
    return NextResponse.json({ nodes: [], edges: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    fs.writeFileSync(dbPath, JSON.stringify(body, null, 2));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}