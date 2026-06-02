import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, TrendingUp, Clock, X, HelpCircle, Mic, MicOff, AlertCircle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useSearchStore } from '../../store/uiStore';
import { searchApi } from '../../services/search.service';
import { questionsApi } from '../../services/questions.service';

interface SearchBarProps {
  autoFocus?: boolean;
  size?: 'default' | 'lg';
}

// ─── Utility: Debounce Hook ──────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ─── Utility: Highlight Text ─────────────────────────────────────────────────
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const HighlightedText = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>;

  const tokens = Array.from(new Set(query.trim().split(/\s+/).map((token) => escapeRegex(token).toLowerCase()))).filter(Boolean);
  if (!tokens.length) return <>{text}</>;

  const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), highlight: false });
    }
    parts.push({ text: text.slice(match.index, match.index + match[0].length), highlight: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlight: false });
  }

  return (
    <>
      {parts.map((part, i) =>
        part.highlight ? (
          <span key={i} className="bg-primary-container/20 text-primary font-semibold rounded-sm px-0.5">
            {part.text}
          </span>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────
const SearchBar = ({ autoFocus = false, size = 'lg' }: SearchBarProps) => {
  const [focused, setFocused] = useState(false);
  const [localQuery, setLocalQuery] = useState('');
  const debouncedQuery = useDebounce(localQuery, 250);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { recentSearches, addRecentSearch, clearRecentSearches } = useSearchStore();

  // Voice Search State
  type VoiceStatus = 'idle' | 'listening' | 'processing' | 'completed' | 'error';
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const [voiceErrorText, setVoiceErrorText] = useState('');
  const recognitionRef = useRef<any>(null);

  const { data: trendingData } = useQuery({
    queryKey: ['trending-searches'],
    queryFn: searchApi.getTrending,
    staleTime: 5 * 60 * 1000,
  });

  const { data: liveSearchData, isFetching: isLiveSearchFetching } = useQuery({
    queryKey: ['live-search', debouncedQuery],
    queryFn: () => searchApi.search(debouncedQuery, 1),
    enabled: debouncedQuery.trim().length > 0 && voiceStatus !== 'listening',
    staleTime: 1 * 60 * 1000,
  });

  const trending = trendingData?.data ?? [];
  const liveResults = liveSearchData?.data ?? [];
  const totalLiveResults = liveSearchData?.meta?.total ?? liveResults.length;

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Effect to automatically search after voice processing completes
  useEffect(() => {
    if (voiceStatus === 'processing') {
      const timer = setTimeout(() => {
        setVoiceStatus('completed');
        if (localQuery.trim()) {
          handleSearch(localQuery);
        }
        setTimeout(() => setVoiceStatus('idle'), 1500);
      }, 600); // Simulate processing delay for smooth UX
      return () => clearTimeout(timer);
    }
  }, [voiceStatus, localQuery]); // localQuery is safe here since we just want to submit it

  const toggleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error('Voice search is not supported in your browser.');
      return;
    }

    if (voiceStatus === 'listening') {
      recognitionRef.current?.stop();
      return;
    }

    try {
      setVoiceErrorText('');
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setVoiceStatus('listening');
        setLocalQuery(''); // Clear existing query when starting new voice search
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setLocalQuery(transcript);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          setVoiceStatus('idle');
          return;
        }

        setVoiceStatus('error');
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceErrorText('Microphone access denied. Please check your browser permissions.');
        } else if (event.error === 'audio-capture') {
          setVoiceErrorText('No microphone found. Please ensure a microphone is connected.');
        } else if (event.error === 'network') {
          setVoiceErrorText('Network error occurred during speech recognition.');
        } else {
          setVoiceErrorText(`Voice recognition error: ${event.error}`);
        }
        
        toast.error(`Voice search failed: ${event.error}`);
        
        setTimeout(() => {
          setVoiceStatus((prev) => (prev === 'error' ? 'idle' : prev));
        }, 4000);
      };

      recognition.onend = () => {
        setVoiceStatus((prev) => {
          if (prev === 'listening') return 'processing';
          return prev;
        });
      };

      recognitionRef.current = recognition;
      recognition.start();
      setFocused(true);
    } catch (err) {
      console.error(err);
      toast.error('Could not start voice search.');
      setVoiceStatus('idle');
    }
  };

  const handleSearch = (q?: string) => {
    const query = (q ?? localQuery).trim();
    if (!query) return;
    addRecentSearch(query);
    setFocused(false);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') {
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setLocalQuery('');
    inputRef.current?.focus();
    if (voiceStatus === 'listening') {
      recognitionRef.current?.stop();
    }
  };

  const showDropdown = focused && (localQuery.trim().length > 0 || recentSearches.length > 0 || trending.length > 0 || voiceStatus !== 'idle');
  const showReset = localQuery.length > 0;
  
  // Calculate right padding based on size and active buttons
  const getRightSpacing = () => {
    if (size === 'lg') {
      if (showReset) return 'pr-28';
      return 'pr-20';
    }
    if (showReset) return 'pr-24';
    return 'pr-16';
  };

  return (
    <div className="relative w-full group">
      <div className={`relative flex items-center ${size === 'lg' ? 'max-w-2xl w-full' : 'w-full'}`}>
        <Search
          size={18}
          className={`absolute left-5 transition-colors duration-200 ${focused ? 'text-primary-container' : 'text-secondary'}`}
        />
        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Search any question..."
          className={`search-input ${getRightSpacing()}`}
          aria-label="Search questions"
          readOnly={voiceStatus === 'listening' || voiceStatus === 'processing'}
        />
        
        <div className="absolute right-2 flex items-center gap-1.5">
          {/* Reset Button */}
          <AnimatePresence>
            {showReset && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={clearSearch}
                className="p-2 text-secondary hover:text-on-surface bg-surface-container-low hover:bg-surface-container rounded-full transition-all"
                aria-label="Clear search"
                title="Clear"
              >
                <X size={16} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Voice Search Button */}
          <button
            type="button"
            onClick={toggleVoiceSearch}
            className={`p-2.5 rounded-full transition-all duration-300 shadow-sm flex items-center justify-center relative ${
              voiceStatus === 'listening' 
                ? 'bg-error text-white animate-pulse' 
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
            }`}
            aria-label="Voice Search"
            title="Search by voice"
          >
            {voiceStatus === 'listening' ? <MicOff size={18} /> : <Mic size={18} />}
            {voiceStatus === 'listening' && (
              <span className="absolute inset-0 rounded-full border-2 border-error animate-ping opacity-75" />
            )}
          </button>

          {/* Search Button (Hidden when listening) */}
          {voiceStatus !== 'listening' && (
            <button
              onClick={() => handleSearch()}
              className="bg-on-surface hover:bg-primary-container text-white p-2.5 rounded-full transition-all duration-300 shadow-sm flex items-center justify-center group/btn"
              aria-label="Search"
              title="Search"
            >
              <ArrowRight size={18} className="group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full left-0 mt-2 bg-surface-container-lowest rounded-xl shadow-ambient-hover border border-outline-variant/30 overflow-hidden z-50 ${size === 'lg' ? 'w-full max-w-2xl' : 'w-full'}`}
          >
            {/* Voice Search Status UI */}
            {voiceStatus !== 'idle' ? (
              <div className="p-6 flex flex-col items-center justify-center text-center">
                {voiceStatus === 'listening' && (
                  <>
                    <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4 relative">
                      <span className="absolute inset-0 rounded-full bg-error/20 animate-ping" />
                      <Mic size={28} className="text-error" />
                    </div>
                    <h3 className="text-lg font-bold text-on-surface mb-2">Listening...</h3>
                    <p className="text-sm text-on-surface-variant max-w-xs">
                      {localQuery ? `"${localQuery}"` : "Speak clearly into your microphone."}
                    </p>
                  </>
                )}
                {voiceStatus === 'processing' && (
                  <>
                    <div className="w-16 h-16 bg-primary-container/10 rounded-full flex items-center justify-center mb-4">
                      <Loader2 size={28} className="text-primary-container animate-spin" />
                    </div>
                    <h3 className="text-lg font-bold text-on-surface mb-2">Processing</h3>
                    <p className="text-sm text-on-surface-variant">Searching for "{localQuery}"...</p>
                  </>
                )}
                {voiceStatus === 'completed' && (
                  <>
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                      <Search size={28} className="text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-on-surface mb-2">Found it!</h3>
                  </>
                )}
                {voiceStatus === 'error' && (
                  <>
                    <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle size={28} className="text-error" />
                    </div>
                    <h3 className="text-lg font-bold text-on-surface mb-2">Oops!</h3>
                    <p className="text-sm text-on-surface-variant">{voiceErrorText}</p>
                    <button 
                      onClick={() => setVoiceStatus('idle')}
                      className="mt-4 text-sm font-semibold text-primary hover:underline"
                    >
                      Try again
                    </button>
                  </>
                )}
              </div>
            ) : localQuery.trim().length > 0 ? (
              /* Live Search Results */
              <div className="py-2">
                {isLiveSearchFetching && debouncedQuery === localQuery ? (
                  <div className="px-4 py-4 flex items-center justify-center gap-3 text-sm text-on-surface-variant">
                    <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Searching FAQs...
                  </div>
                ) : liveResults.length > 0 ? (
                  <>
                    <div className="px-4 pt-2 pb-2 flex justify-between items-center bg-surface-container-lowest">
                      <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                        Suggested Results ({totalLiveResults})
                      </span>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {liveResults.slice(0, 5).map((q) => (
                        <button
                          key={q._id}
                          onClick={() => {
                            setFocused(false);
                            questionsApi.recordSearchClick(q._id).catch(() => {});
                            navigate(`/questions/${q._id}`);
                          }}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-surface-container-low transition-colors text-left border-b border-outline-variant/10 last:border-0"
                        >
                          <HelpCircle size={16} className="text-primary-container mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-on-surface line-clamp-2 leading-snug mb-1">
                              <HighlightedText text={q.title} query={localQuery} />
                            </p>
                            <p className="text-xs text-on-surface-variant line-clamp-1">
                              <HighlightedText text={q.description || ''} query={localQuery} />
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                    {totalLiveResults > 5 && (
                      <button
                        onClick={() => handleSearch()}
                        className="w-full text-center py-3 bg-surface-container-lowest hover:bg-surface-container-low text-sm font-semibold text-primary transition-colors border-t border-outline-variant/20"
                      >
                        View all {totalLiveResults} results
                      </button>
                    )}
                  </>
                ) : (
                  <div className="px-4 py-8 text-center flex flex-col items-center">
                    <div className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center mb-3">
                      <Search size={20} className="text-on-surface-variant" />
                    </div>
                    <p className="text-sm font-semibold text-on-surface mb-1">No matches found</p>
                    <p className="text-xs text-on-surface-variant max-w-[250px]">
                      We couldn't find any FAQs matching "{localQuery}". Try adjusting your search terms or hit enter to search all topics.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Recent and Trending Searches */
              <div className="py-2">
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-4 pt-3 pb-2">
                      <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Recent</span>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs font-medium text-primary-container hover:text-primary transition-colors"
                      >
                        Clear History
                      </button>
                    </div>
                    {recentSearches.slice(0, 4).map((q) => (
                      <button
                        key={q}
                        onClick={() => { setLocalQuery(q); handleSearch(q); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors text-left group/recent"
                      >
                        <Clock size={16} className="text-on-surface-variant flex-shrink-0" />
                        <span className="flex-1 truncate">{q}</span>
                        <ArrowRight size={14} className="text-on-surface-variant opacity-0 group-hover/recent:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}

                {trending.length > 0 && (
                  <div className={recentSearches.length > 0 ? 'border-t border-outline-variant/20 mt-2 pt-2' : ''}>
                    <div className="px-4 pt-3 pb-2">
                      <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Trending Topics</span>
                    </div>
                    {trending.slice(0, 5).map((item) => (
                      <button
                        key={item.query}
                        onClick={() => { setLocalQuery(item.query); handleSearch(item.query); }}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-container-low transition-colors text-left group/trend"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <TrendingUp size={16} className="text-primary flex-shrink-0" />
                          <span className="text-sm text-on-surface truncate font-medium group-hover/trend:text-primary transition-colors">{item.query}</span>
                        </div>
                        <span className="text-[11px] font-semibold bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full ml-3 flex-shrink-0">
                          {item.count} searches
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
