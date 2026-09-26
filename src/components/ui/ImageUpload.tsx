'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, X, Check, Loader2, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  bucket?: 'product-images' | 'customer-avatars' | 'employee-avatars' | 'business-logos';
  label?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  bucket = 'product-images',
  label = 'Upload Image',
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        onChange(data.url);
      } else {
        setError(data.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Network error while uploading');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="block text-xs font-semibold text-slate-700">{label}</label>}

      {value ? (
        <div className="relative group w-32 h-32 rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
          <img src={value} alt="Uploaded preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 bg-white text-slate-700 rounded-lg hover:bg-slate-100 transition text-xs font-bold"
              title="Replace image"
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              title="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full sm:w-64 border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-1.5 text-blue-600">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-[11px] font-medium">Uploading to vault...</span>
            </div>
          ) : (
            <>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">Click to upload image</p>
                <p className="text-[10px] text-slate-400">JPG, PNG, WEBP up to 5MB</p>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/jpg"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
