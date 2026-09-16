import { useState, useRef, useCallback } from 'react';
import { IconUpload, IconRoute, IconFile, IconX } from '@tabler/icons-react';

/**
 * GPX dropzone — drag-and-drop or click-to-select for GPX files.
 *
 * The component is intentionally minimal: it captures a `.gpx` file, exposes
 * the filename + a parsed basic metadata blob (via the lazy `gpx-parser`),
 * and writes a hidden input with the file so the parent form can submit it
 * as multipart/form-data or read it via FileReader on the client side.
 *
 * Why a React island: drag-and-drop UX needs state management for visual
 * feedback during drag-over (highlight zone), which is awkward in vanilla JS
 * and cheap in React.
 */

interface GpxDropzoneProps {
  /** name for the hidden file input — used by FormData */
  name?: string;
  /** Optional initial file name (edit mode) */
  initialFilename?: string;
  /** Maximum file size in MB */
  maxSizeMb?: number;
}

interface UploadedFile {
  name: string;
  size: number;
  pointCount?: number;
  distanceKm?: number;
}

const GPX_ACCEPT = '.gpx,application/gpx+xml,text/xml,application/xml';

export default function GpxDropzone({
  name = 'distance_gpx',
  initialFilename,
  maxSizeMb = 5,
}: GpxDropzoneProps) {
  const [file, setFile] = useState<UploadedFile | null>(
    initialFilename ? { name: initialFilename, size: 0 } : null
  );
  const [error, setError] = useState<string | null>(null);
  const [isOver, setIsOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validate = (f: File): string | null => {
    if (!/\.gpx$/i.test(f.name)) return 'Solo se permiten archivos .gpx';
    if (f.size / (1024 * 1024) > maxSizeMb)
      return `El archivo supera el máximo de ${maxSizeMb}MB`;
    return null;
  };

  const handleFiles = useCallback(async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const f = list[0];
    const err = validate(f);
    if (err) {
      setError(err);
      setFile(null);
      return;
    }
    setError(null);
    // Quick textual sniff to count <trkpt> entries — fast enough on gpx files (~MBs).
    let count: number | undefined;
    let km: number | undefined;
    try {
      const text = await f.slice(0, Math.min(f.size, 256_000)).text();
      count = (text.match(/<trkpt\b/gi) ?? []).length;
      // Very rough distance computation — coordinate haversine from extracted points.
      const coords: Array<[number, number]> = [];
      const re = /<trkpt\s+lat="([\-0-9.]+)"\s+lon="([\-0-9.]+)"/gi;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        coords.push([parseFloat(m[2]), parseFloat(m[1])]);
      }
      if (coords.length > 1) {
        let total = 0;
        for (let i = 1; i < coords.length; i++) {
          total += haversineKm(coords[i - 1], coords[i]);
        }
        km = Math.round(total * 10) / 10;
      }
    } catch {
      /* tolerate */
    }
    setFile({ name: f.name, size: f.size, pointCount: count, distanceKm: km });
  }, [maxSizeMb]);

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={GPX_ACCEPT}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={[
          'rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
          isOver
            ? 'border-blue-500 bg-blue-50'
            : file
              ? 'border-emerald-300 bg-emerald-50/40'
              : 'border-zinc-300 bg-zinc-50/40 hover:border-blue-400 hover:bg-blue-50/30',
        ].join(' ')}
      >
        {file ? (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-emerald-700 text-sm font-medium">
              <IconRoute size={20} />
              {file.name}
            </div>
            <div className="flex justify-center gap-3 text-xs text-zinc-500">
              <span>{Math.round(file.size / 1024)} KB</span>
              {file.pointCount !== undefined && (
                <span>{file.pointCount} puntos</span>
              )}
              {file.distanceKm !== undefined && (
                <span>{file.distanceKm} km aprox.</span>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
            >
              <IconX size={12} /> Quitar
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600">
              <IconUpload size={22} />
            </div>
            <div className="text-sm text-zinc-700 font-medium">
              Arrastra tu archivo GPX aquí
            </div>
            <div className="text-xs text-zinc-500">
              o haz click para seleccionar (máx. {maxSizeMb} MB)
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
              <IconFile size={12} /> .gpx
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const la1 = toRad(lat1);
  const la2 = toRad(lat2);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
