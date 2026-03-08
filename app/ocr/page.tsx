"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "../components/Card";
import { Button } from "../components/ui/button";
import PageHeader from "../components/PageHeader";
import { performOCR } from "../../lib/ocr-client";

interface ExtractedTextProps {
  text: string;
  onCopy: () => void;
  onSendToSummarizer: () => void;
}

function ExtractedText({ text, onCopy, onSendToSummarizer }: ExtractedTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy();
  };

  return (
    <Card title="Extracted Text">
      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => {}}
          placeholder="Extracted text will appear here..."
          className="w-full h-64 border border-gray-200 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
        />
        
        {text && (
          <div className="flex gap-3">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1"
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </Button>
            <Button
              onClick={onSendToSummarizer}
              className="flex-1"
            >
              Send to Summarizer
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function OCRPage() {
  const [extractedText, setExtractedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const processImage = async (file: File) => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      setUploadedImage(imageUrl);
      
      try {
        console.log("Starting OCR processing...");
        // ✅ Use client-side OCR
        const text = await performOCR(file);
        
        if (text && text.trim().length > 0) {
          setExtractedText(text);
        } else {
          setExtractedText("No text could be extracted from this image. Please try a clearer image.");
        }
      } catch (err) {
        console.error("OCR Error:", err);
        setError(err instanceof Error ? err.message : "Error processing image");
        setExtractedText("Error processing image. Please try again with a clearer image.");
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      processImage(imageFile as File);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            processImage(file);
          }
        });
      }
      
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setError('Camera access denied or not available. Please use file upload instead.');
    }
  };

  const handleSendToSummarizer = () => {
    if (extractedText) {
      router.push(`/summarize?text=${encodeURIComponent(extractedText)}`);
    }
  };

  const handleCopy = () => {
    // Copy feedback handled in ExtractedText component
  };

  const resetUpload = () => {
    setExtractedText("");
    setUploadedImage(null);
    setError(null);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader 
        title="Image to Text" 
        description="Extract text from images using advanced OCR technology"
      />

      <div className="grid lg:grid-cols-2 gap-8">
        <Card title="Upload Image">
          <div className="space-y-4">
            {/* Upload Zone */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
                isDragging 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="flex flex-col items-center justify-center text-center">
                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-600 font-medium mb-1">
                  {isDragging ? "Drop your image here" : "Drag & drop an image here"}
                </p>
                <p className="text-gray-500 text-sm">or click to browse</p>
              </div>
            </div>

            {/* Camera Capture Button */}
            {isMounted && typeof navigator !== 'undefined' && navigator.mediaDevices && (
              <Button
                onClick={handleCameraCapture}
                variant="outline"
                className="w-full"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Take Photo
              </Button>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Processing image (this may take up to 2 minutes)...</span>
              </div>
            )}

            {/* Image Preview */}
            {uploadedImage && !isLoading && (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-gray-100">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded" 
                    className="w-full h-48 object-cover"
                  />
                </div>
                <Button 
                  onClick={resetUpload}
                  variant="outline" 
                  className="w-full"
                >
                  Upload Different Image
                </Button>
              </div>
            )}
          </div>
        </Card>

        <ExtractedText 
          text={extractedText}
          onCopy={handleCopy}
          onSendToSummarizer={handleSendToSummarizer}
        />
      </div>
    </div>
  );
}
