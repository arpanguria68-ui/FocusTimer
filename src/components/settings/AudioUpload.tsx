import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Music, Upload, X, Play, Square } from 'lucide-react';
import { toast } from 'sonner';

interface AudioUploadProps {
    currentAudio?: string;
    onAudioChange: (audioData: string | undefined) => void;
    disabled?: boolean;
    maxSizeKB?: number;
}

export const AudioUpload: React.FC<AudioUploadProps> = ({
    currentAudio,
    onAudioChange,
    disabled = false,
    maxSizeKB = 500 // Default 500KB limit
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check file size
        if (file.size > maxSizeKB * 1024) {
            toast.error(`Audio file must be smaller than ${maxSizeKB}KB`);
            return;
        }

        // Check file type
        if (!file.type.startsWith('audio/')) {
            toast.error('Please upload a valid audio file');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            onAudioChange(base64String);
            toast.success('Audio uploaded successfully');
        };
        reader.onerror = () => {
            toast.error('Failed to read file');
        };
        reader.readAsDataURL(file);
    };

    const handleRemove = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
        onAudioChange(undefined);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const togglePreview = () => {
        if (!currentAudio) return;

        if (!audioRef.current) {
            audioRef.current = new Audio(currentAudio);
            audioRef.current.onended = () => setIsPlaying(false);
        }

        if (isPlaying) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        } else {
            audioRef.current.src = currentAudio; // Ensure src is updated
            audioRef.current.play().catch(e => {
                console.error("Audio playback error:", e);
                toast.error("Failed to play audio preview");
            });
            setIsPlaying(true);
        }
    };

    return (
        <div className="space-y-3">
            <Label>Notification Sound</Label>

            {!currentAudio ? (
                <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
                    onClick={() => !disabled && fileInputRef.current?.click()}
                >
                    <Music className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Upload custom sound</p>
                    <p className="text-xs text-muted-foreground mt-1">MP3, WAV (Max {maxSizeKB}KB)</p>
                </div>
            ) : (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Music className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">Custom Notification Sound</p>
                        <p className="text-xs text-muted-foreground">Ready to play</p>
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={togglePreview}
                            disabled={disabled}
                            title={isPlaying ? "Stop" : "Preview"}
                        >
                            {isPlaying ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRemove}
                            disabled={disabled}
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled}
            />
        </div>
    );
};
