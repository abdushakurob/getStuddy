'use client';

import { useRef, useEffect, useState } from 'react';
import { useResource } from '@/context/ResourceContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, Loader2, Maximize } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import ReactPlayer to prevent SSR hydration mismatches
const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

interface MediaPlayerProps {
    url: string;
    type: 'video' | 'audio';
}

export default function MediaPlayer({ url, type }: MediaPlayerProps) {
    const playerRef = useRef<any>(null);
    const { registerMediaHandler } = useResource();

    // State
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0); // 0 to 100
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const [isSeeking, setIsSeeking] = useState(false);
    const [pendingSeek, setPendingSeek] = useState<number | null>(null);

    // Register Handler for Context (AI Jump to timestamp)
    useEffect(() => {
        registerMediaHandler({
            play: () => setIsPlaying(true),
            pause: () => setIsPlaying(false),
            seek: (seconds) => {
                console.log("MediaPlayer: Seek requested to", seconds);
                if (isReady && playerRef.current) {
                    playerRef.current.seekTo(seconds, 'seconds');
                    setIsPlaying(true);
                } else {
                    console.log("MediaPlayer: Player not ready, queuing seek to", seconds);
                    setPendingSeek(seconds);
                }
            }
        });
    }, [registerMediaHandler, isReady]); // Added isReady dependency to update handler closure

    // Handle pending seek when ready
    useEffect(() => {
        if (isReady && pendingSeek !== null && playerRef.current) {
            console.log("MediaPlayer: Executing queued seek to", pendingSeek);
            playerRef.current.seekTo(pendingSeek, 'seconds');
            setIsPlaying(true);
            setPendingSeek(null);
        }
    }, [isReady, pendingSeek]);

    // Handlers
    const togglePlay = () => setIsPlaying(!isPlaying);

    const handleProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
        if (!isSeeking) {
            setProgress(state.played * 100);
            setCurrentTime(state.playedSeconds);
        }
    };

    const handleDuration = (d: number) => {
        setDuration(d);
    };

    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsSeeking(true);
        const newProgress = parseFloat(e.target.value);
        setProgress(newProgress);
        const newTime = (newProgress / 100) * duration;
        setCurrentTime(newTime);
    };

    const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
        setIsSeeking(false);
        const newProgress = parseFloat((e.target as HTMLInputElement).value);
        if (playerRef.current) {
            playerRef.current.seekTo(newProgress / 100, 'fraction');
        }
    };

    const skip = (seconds: number) => {
        if (playerRef.current) {
            const newTime = currentTime + seconds;
            playerRef.current.seekTo(newTime, 'seconds');
        }
    };

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full h-full flex flex-col bg-black relative group rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">

            {/* Player Container */}
            <div className="flex-1 relative flex items-center justify-center bg-black">
                {/* Loader Overlay */}
                {!isReady && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50 backdrop-blur-sm">
                        <Loader2 className="animate-spin text-white" size={32} />
                    </div>
                )}

                <ReactPlayer
                    ref={playerRef}
                    url={url}
                    playing={isPlaying}
                    controls={false} // Custom controls
                    width="100%"
                    height="100%"
                    onReady={() => setIsReady(true)}
                    onProgress={handleProgress}
                    onDuration={handleDuration}
                    onEnded={() => setIsPlaying(false)}
                    onError={(e) => console.error("MediaPlayer Error:", e)}
                    progressInterval={100} // Smooth updates
                    config={{
                        youtube: {
                            playerVars: {
                                showinfo: 0,
                                controls: 0,
                                modestbranding: 1,
                                rel: 0,
                                autoplay: 1, // Require for seeking to work reliably on some clients
                                allowSeekAhead: 1
                            }
                        }
                    }}
                />

                {/* Big Play Button Overlay (Optional - usually good UX) */}
                {!isPlaying && isReady && (
                    <div
                        className="absolute inset-0 flex items-center justify-center bg-black/10 cursor-pointer group-hover:bg-black/20 transition-all"
                        onClick={togglePlay}
                    >
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 hover:scale-105 transition-all shadow-xl border border-white/10">
                            <Play size={32} fill="white" className="text-white ml-1" />
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Control Bar */}
            <div className={`h-16 bg-gradient-to-t from-black/90 to-transparent absolute bottom-0 left-0 right-0 px-4 flex items-end pb-3 gap-4 transition-transform duration-300 ${!isPlaying ? 'translate-y-0' : 'translate-y-full group-hover:translate-y-0'}`}>

                {/* Play/Pause */}
                <button
                    onClick={togglePlay}
                    className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                </button>

                {/* Progress Bar & Time */}
                <div className="flex-1 flex flex-col justify-center gap-1">
                    <div className="flex items-center justify-between text-[10px] font-medium text-gray-300 px-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={progress}
                        onChange={handleSeekChange}
                        onMouseUp={handleSeekMouseUp}
                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#4C8233] hover:accent-[#5da13e] transition-all"
                    />
                </div>

                {/* Skip Buttons */}
                <div className="flex items-center gap-1">
                    <button onClick={() => skip(-10)} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="-10s">
                        <SkipBack size={18} />
                    </button>
                    <button onClick={() => skip(10)} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="+10s">
                        <SkipForward size={18} />
                    </button>
                </div>

                {/* (Optional) Volume/Fullscreen could go here */}
            </div>
        </div>
    );
}
