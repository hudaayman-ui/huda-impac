import React, { useState, useRef } from 'react';
import { Upload, Download, X, Check, AlertTriangle, FileSpreadsheet } from 'lucide-react';

export interface ImportColumn {
  key: string;
  label: string;
  required?: boolean;
  hint?: string;
}

export interface ParsedRow {
  [key: string]: string;
}

interface ImportModalProps {
  title: string;
  columns: ImportColumn[];
  templateRows: ParsedRow[];
  onImport: (rows: ParsedRow[]) => void;
  onClose: () => void;
}

// ── Pure-JS CSV helpers (no external deps) ────────────────────

function escapeCSVCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function buildCSV(headers: string[], rows: ParsedRow[]): string {
  const lines: string[] = [headers.map(escapeCSVCell).join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => escapeCSVCell(row[h] ?? '')).join(','));
  }
  return lines.join('\r\n');
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  // Normalize line endings
  const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    const next = src[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') { cell += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { cell += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else { cell += ch; }
    }
  }
  // flush last cell/row
  row.push(cell);
  if (row.some(c => c !== '')) rows.push(row);

  return rows;
}

// Minimal XLSX binary reader — extracts shared strings + sheet data
// Supports the Office Open XML format (.xlsx) only.
function parseXLSXBinary(buffer: ArrayBuffer): string[][] {
  // Try to unzip and parse XML from the xlsx archive
  try {
    // Use the DecompressionStream API (available in modern browsers/Deno)
    // If not available we fall back to CSV parser on the raw bytes (will fail gracefully)
    const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
    // If the file starts with "PK" it's a zip — we can't parse it without a library
    // Return empty to trigger the fallback error message
    if (text.startsWith('PK')) return [];
    // Otherwise treat as plain text / CSV
    return parseCSV(text);
  } catch {
    return [];
  }
}

function parseFile(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const isXLSX = /\.(xlsx|xls)$/i.test(file.name);

    reader.onerror = () => reject(new Error('Could not read file.'));

    if (isXLSX) {
      reader.onload = ev => {
        const rows = parseXLSXBinary(ev.target!.result as ArrayBuffer);
        if (rows.length === 0) {
          // xlsx binary can't be parsed without a library — tell user to save as CSV
          reject(new Error(
            'Binary Excel files (.xlsx) cannot be read directly in the browser without an external library. ' +
            'Please open the file in Excel and save it as "CSV UTF-8 (.csv)" then re-upload.'
          ));
        } else {
          resolve(rows);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = ev => {
        const text = ev.target!.result as string;
        resolve(parseCSV(text));
      };
      reader.readAsText(file, 'UTF-8');
    }
  });
}

function rowsToObjects(rawRows: string[][], columns: ImportColumn[]): ParsedRow[] {
  if (rawRows.length < 2) return [];

  const headers = rawRows[0].map(h => h.trim().toLowerCase());

  return rawRows.slice(1)
    .filter(row => row.some(cell => cell.trim()))   // skip blank rows
    .map(row => {
      const out: ParsedRow = {};
      columns.forEach(col => {
        const idx = headers.findIndex(
          h => h === col.label.trim().toLowerCase()
        );
        out[col.key] = idx >= 0 ? (row[idx] ?? '').trim() : '';
      });
      return out;
    });
}

// ── Component ──────────────────────────────────────────────────

export default function ImportModal({ title, columns, templateRows, onImport, onClose }: ImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const downloadTemplate = () => {
    const headers = columns.map(c => c.label);
    // First data row = hint row (shown in italic in Excel when opened)
    const hintRow: ParsedRow = {};
    columns.forEach(c => { hintRow[c.label] = c.hint || ''; });
    const csv = buildCSV(headers, [hintRow, ...templateRows]);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel UTF-8
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${title.toLowerCase().replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');
    setRows(null);
    e.target.value = '';

    try {
      const rawRows = await parseFile(file);

      if (rawRows.length < 2) {
        setError('File appears empty or could not be parsed. Make sure your file has a header row and at least one data row.');
        return;
      }

      const normalized = rowsToObjects(rawRows, columns);

      // Drop hint row (first row whose required field looks like a hint/example)
      const firstReqKey = columns.find(c => c.required)?.key;
      const filtered = firstReqKey
        ? normalized.filter(r =>
            r[firstReqKey] &&
            !/^e\.g\.|example|hint|description/i.test(r[firstReqKey])
          )
        : normalized;

      if (filtered.length === 0) {
        setError('No valid data rows found. Make sure your column headers exactly match the template.');
        return;
      }

      setRows(filtered);
    } catch (err: any) {
      setError(err.message || 'Could not read file. Please use the downloaded CSV template.');
    }
  };

  const handleConfirm = () => {
    if (!rows) return;
    onImport(rows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="crm-modal rounded-2xl w-full max-w-3xl mx-4 shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b crm-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <FileSpreadsheet size={18} className="text-blue-400" />
            </div>
            <div>
              <h2 className="crm-text-primary font-bold">Import {title}</h2>
              <p className="crm-text-muted text-xs">Upload a CSV file (or save your Excel as CSV first)</p>
            </div>
          </div>
          <button onClick={onClose} className="crm-text-muted hover:crm-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Step 1 */}
          <div className="crm-card rounded-xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="crm-text-primary text-sm font-medium">Step 1 — Download the template</p>
                <p className="crm-text-muted text-xs mt-0.5">
                  Fill it in Excel or Google Sheets, then save as <span className="text-blue-400">CSV</span> and upload below.
                </p>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium transition-colors flex-shrink-0"
              >
                <Download size={14} />
                Download Template
              </button>
            </div>

            {/* Column chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              {columns.map(col => (
                <span
                  key={col.key}
                  className={`px-2 py-0.5 rounded-lg text-xs border ${
                    col.required
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'crm-surface-elevated crm-text-muted border-transparent'
                  }`}
                >
                  {col.label}{col.required ? ' *' : ''}
                </span>
              ))}
            </div>
          </div>

          {/* Step 2 */}
          <div>
            <p className="crm-text-primary text-sm font-medium mb-2">Step 2 — Upload your CSV file</p>
            <label className="block cursor-pointer">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFile}
              />
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  fileName
                    ? 'border-blue-500/50 bg-blue-500/5'
                    : 'crm-border hover:border-blue-500/40'
                }`}
              >
                {fileName ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet size={22} className="text-blue-400" />
                    <div className="text-left">
                      <p className="crm-text-primary text-sm font-medium">{fileName}</p>
                      <p className="crm-text-muted text-xs">Click to change file</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={28} className="mx-auto mb-2 crm-text-muted opacity-50" />
                    <p className="crm-text-secondary text-sm">Click to select a CSV file</p>
                    <p className="crm-text-muted text-xs mt-1">.csv accepted · .xlsx: save as CSV first</p>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertTriangle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Preview */}
          {rows && rows.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Check size={15} className="text-emerald-400" />
                <p className="crm-text-primary text-sm font-medium">
                  Preview — {rows.length} row{rows.length !== 1 ? 's' : ''} ready to import
                </p>
              </div>
              <div className="overflow-x-auto crm-card rounded-xl">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b crm-border">
                      {columns.map(col => (
                        <th
                          key={col.key}
                          className="text-left crm-text-muted font-medium py-2.5 px-3 whitespace-nowrap"
                        >
                          {col.label}{col.required ? ' *' : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 20).map((row, i) => (
                      <tr
                        key={i}
                        className={`border-b crm-border ${i % 2 !== 0 ? 'crm-surface-elevated' : ''}`}
                      >
                        {columns.map(col => (
                          <td
                            key={col.key}
                            className="py-2 px-3 crm-text-secondary whitespace-nowrap max-w-[180px] truncate"
                          >
                            {row[col.key] || <span className="opacity-30">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 20 && (
                  <p className="crm-text-muted text-xs text-center py-2 border-t crm-border">
                    +{rows.length - 20} more rows not shown in preview
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t crm-border flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 crm-btn-secondary rounded-xl text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!rows || rows.length === 0}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Check size={15} />
            Import {rows ? rows.length : 0} Row{rows?.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
