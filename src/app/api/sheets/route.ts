import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1z2EtDU6YXownVQkX5VL2tqvbo2TcOv4BJydraXVzcnE';

export const revalidate = 86400; // ISR: 24h
export const dynamic = 'force-dynamic';

async function getGoogleSheetsClient() {
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!privateKey || !process.env.GOOGLE_CLIENT_EMAIL) {
    throw new Error('Missing Google credentials');
  }

  // Handle base64 or escaped newlines
  if (!privateKey.includes('-----BEGIN')) {
    try { privateKey = Buffer.from(privateKey, 'base64').toString('utf-8'); } catch {}
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

function parseRows(rows: string[][]): { date: string; value: number }[] {
  return (rows || [])
    .filter(row => row[0] && row[1])
    .map(row => ({ date: row[0], value: parseFloat(row[1]) || 0 }));
}

export async function GET() {
  try {
    const sheets = await getGoogleSheetsClient();

    const [volumeRes, txnsRes, gamedRes, snapshotRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'raw_volume!B2:C500' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'raw_txns!B2:C500' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'raw_gamed!B2:C500' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'snapshot!A1:M10' }),
    ]);

    return NextResponse.json({
      volume:      parseRows(volumeRes.data.values as string[][] || []),
      txns:        parseRows(txnsRes.data.values as string[][] || []),
      gamed:       parseRows(gamedRes.data.values as string[][] || []),
      snapshot:    snapshotRes.data.values || [],
      lastUpdated: new Date().toISOString(),
      source:      'google-sheets',
    });
  } catch (err) {
    console.error('Sheets API error:', err);

    // Fall back to static data
    try {
      const fallback = await import('./data.json');
      return NextResponse.json({ ...fallback, source: 'fallback' });
    } catch {
      return NextResponse.json(
        { error: 'Failed to fetch data', source: 'error' },
        { status: 500 }
      );
    }
  }
}
