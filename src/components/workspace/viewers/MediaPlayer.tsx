'use client';

import { useRef, useEffect, useState } from 'react';
import { useResource } from '@/context/ResourceContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, Sparkles } from 'lucide-react';

interface MediaPlayerProps {
    url: string;
    type: 'video' | 'audio';
}

export default function MediaPlayer({ url, type }: MediaPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const { registerMediaHandler } = useResource();

    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const ref = type === 'video' ? videoRef.current : audioRef.current;
        if (!ref) return;

        registerMediaHandler({
            play: () => ref.play(),
            pause: () => ref.pause(),
            seek: (t) => { ref.currentTime = t; }
        });
    }, [registerMediaHandler, type]);

    const handleTimeUpdate = () => {
        const ref = type === 'video' ? videoRef.current : audioRef.current;
        if (ref) {
            const percent = (ref.currentTime / ref.duration) * 100;
            setProgress(percent || 0);
            setCurrentTime(ref.currentTime);
            setDuration(ref.duration);
        }
    };

    const togglePlay = () => {
        const ref = type === 'video' ? videoRef.current : audioRef.current;
        if (!ref) return;
        if (ref.paused) {
            ref.play();
            setIsPlaying(true);
        } else {
            ref.pause();
            setIsPlaying(false);
        }
    };

    const skip = (seconds: number) => {
        const ref = type === 'video' ? videoRef.current : audioRef.current;
        if (ref) ref.currentTime += seconds;
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-900 relative group">

            {/* Media Element */}
            <div className="flex-1 flex items-center justify-center overflow-hidden bg-black">
                {type === 'video' ? (
                    <video
                        ref={videoRef}
                        src={url}
                        className="w-full h-full object-contain"
                        onTimeUpdate={handleTimeUpdate}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                    />
                ) : (
                    <div className="w-full flex flex-col items-center justify-center p-10">
                        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#4C8233] to-[#2F4F2F] flex items-center justify-center mb-6 shadow-2xl">
                            <Volume2 size={64} className="text-white" />
                        </div>
                        <audio
                            ref={audioRef}
                            src={url}
                            onTimeUpdate={handleTimeUpdate}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                        />
                        <p className="text-white font-medium text-lg">Audio Lecture</p>
                        <p className="text-gray-400 text-sm mt-1">Listen along with your companion</p>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/90 to-transparent p-6 opacity-0 group-hover:opacity-100 transition-opacity">

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden cursor-pointer">
                        <div
                            className="h-full bg-gradient-to-r from-[#4C8233] to-[#84A98C] transition-all duration-100"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-400 font-medium">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={() => skip(-10)}
                        className="p-2 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition-colors"
                        title="Back 10s"
                    >
                        <SkipBack size={20} />
                    </button>

                    <button
                        onClick={togglePlay}
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4C8233] to-[#2F4F2F] hover:from-[#84A98C] hover:to-[#4C8233] flex items-center justify-center text-white shadow-lg transition-all"
                    >
                        {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" className="ml-0.5" />}
                    </button>

                    <button
                        onClick={() => skip(10)}
                        className="p-2 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition-colors"
                        title="Forward 10s"
                    >
                        <SkipForward size={20} />
                    </button>
                </div>

                {/* Companion Hint */}
                <div className="mt-4 flex items-center justify-center gap-2 text-[#A3B18A] text-xs font-medium">
                    <Sparkles size={12} />
                    <span>I'll pause when there's a key concept</span>
                </div>
            </div>
        </div>
    );
}
