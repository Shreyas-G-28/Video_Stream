'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, Mic, MicOff, Bell, Video, PlaySquare, X } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { getSuggestions } from '../data/catalog';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  resetView: () => void;
  onSearch?: (term: string) => void;
  searchQuery?: string;
}

const Header: React.FC<HeaderProps> = ({
  sidebarOpen,
  setSidebarOpen,
  resetView,
  onSearch,
  searchQuery = '',
}) => {
  const [inputValue, setInputValue] = useState<string>(searchQuery);
  const [prevSearchQuery, setPrevSearchQuery] = useState<string>(searchQuery);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const debouncedSearchTerm = useDebounce(inputValue, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Sync state with prop during render to avoid cascading renders in useEffect
  if (searchQuery !== prevSearchQuery) {
    setPrevSearchQuery(searchQuery);
    setInputValue(searchQuery);
  }

  // Compute suggestions directly from the debounced search term without setState in an effect
  const suggestions = React.useMemo(() => {
    if (!debouncedSearchTerm.trim()) return [];
    return getSuggestions(debouncedSearchTerm, 8);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (term: string) => {
    setShowSuggestions(false);
    if (onSearch) {
      onSearch(term);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(inputValue);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const clearInput = () => {
    setInputValue('');
    if (onSearch) {
      onSearch('');
    }
  };

  const toggleListening = () => {
    // If already listening, stop recognition
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    setVoiceError(null);

    // Check browser SpeechRecognition support
    const SpeechRecognition =
      (typeof window !== 'undefined' &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;

    if (!SpeechRecognition) {
      setVoiceError('Speech recognition is not supported in this browser.');
      setTimeout(() => setVoiceError(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputValue(transcript);
          // If final result, submit search
          if (event.results[event.resultIndex]?.isFinal) {
            handleSearchSubmit(transcript);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setVoiceError(`Voice input error: ${event.error}`);
          setTimeout(() => setVoiceError(null), 4000);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to initialize speech recognition', err);
      setVoiceError('Unable to start speech recognition.');
      setIsListening(false);
      setTimeout(() => setVoiceError(null), 4000);
    }
  };

  return (
    <header className="flex-shrink-0 sticky top-0 z-50 flex items-center justify-between px-4 h-14 bg-[#0f0f0f] border-b border-zinc-800/40 w-full">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-zinc-800 rounded-full transition-colors hidden md:block"
          aria-label="Toggle sidebar"
        >
          <Menu size={24} className="text-white" />
        </button>
        <div className="flex items-center gap-1 cursor-pointer" onClick={resetView}>
          <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center">
            <PlaySquare size={16} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-white">YouTube</span>
        </div>
      </div>

      <div className="flex-1 max-w-[600px] flex items-center gap-4 ml-8 mr-4 relative" ref={containerRef}>
        <div className="flex-1 relative flex items-center bg-[#121212] border border-zinc-700 rounded-full focus-within:border-blue-500 ml-4 md:ml-0">
          <div className="px-4 text-zinc-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search"
            className="flex-1 bg-transparent text-zinc-100 py-2 outline-none text-sm placeholder-zinc-500"
          />
          {inputValue && (
            <button
              onClick={clearInput}
              className="p-1.5 mr-1 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={() => handleSearchSubmit(inputValue)}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 border-l border-zinc-700 rounded-r-full transition-colors"
            aria-label="Search"
          >
            <Search size={18} className="text-white" />
          </button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-12 left-4 md:left-0 right-14 bg-[#212121] border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden py-2 z-50">
            {suggestions.map((item, index) => (
              <div
                key={index}
                onClick={() => {
                  setInputValue(item);
                  handleSearchSubmit(item);
                }}
                className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-700/60 cursor-pointer text-sm text-zinc-200 transition-colors"
              >
                <Search size={16} className="text-zinc-400 flex-shrink-0" />
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={toggleListening}
            aria-label={isListening ? 'Stop listening' : 'Search with your voice'}
            title={isListening ? 'Listening... click to stop' : 'Search with your voice'}
            className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 transition-all ${
              isListening
                ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-400'
                : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            }`}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          {voiceError && (
            <div className="absolute top-12 right-0 bg-red-950/90 border border-red-700 text-red-200 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50">
              {voiceError}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button className="p-2 hover:bg-zinc-800 rounded-full transition-colors hidden sm:block">
          <Video size={20} className="text-white" />
        </button>
        <button className="p-2 hover:bg-zinc-800 rounded-full transition-colors hidden sm:block">
          <Bell size={20} className="text-white" />
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold ml-2 cursor-pointer border border-transparent hover:border-blue-400 text-white">
          A
        </div>
      </div>
    </header>
  );
};

export default Header;