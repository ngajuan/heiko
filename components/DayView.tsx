'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, GripVertical, X, ChevronUp, ChevronDown } from 'lucide-react';

const formatTime = (time) => {
  const hours = Math.floor(time);
  const minutes = Math.round((time % 1) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const formatDuration = (duration) => {
  const hours = Math.floor(duration);
  const minutes = Math.round((duration % 1) * 60);
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
};

const Button = ({ children, variant = 'default', ...props }) => (
  <button 
    className={`px-4 py-2 rounded ${
      variant === 'ghost' 
        ? 'hover:bg-gray-700' 
        : 'bg-gray-700 hover:bg-gray-600'
    }`}
    {...props}
  >
    {children}
  </button>
);

const DayView = () => {
  const [date, setDate] = useState(new Date());
  const [columns, setColumns] = useState(1);
  const [events, setEvents] = useState([]);
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [editingEventId, setEditingEventId] = useState(null);
  const [resizingEvent, setResizingEvent] = useState(null);
  const [dragCreating, setDragCreating] = useState(null);

  const dragItem = useRef(null);
  const dragNode = useRef(null);

  const getTimeFromY = (y) => Math.floor(y / 64 * 2) / 2;

  const pushToHistory = (newEvents) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newEvents);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleDragStart = (e, event) => {
    e.stopPropagation();
    dragItem.current = event;
    dragNode.current = e.target;
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDrag = (e, columnIndex) => {
    e.preventDefault();
    if (!dragItem.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const time = getTimeFromY(y);
    
    const duration = dragItem.current.end - dragItem.current.start;
    setEvents(prev => prev.map(ev => 
      ev.id === dragItem.current.id 
        ? { ...ev, start: time, end: time + duration, column: columnIndex }
        : ev
    ));
  };

  const handleResize = (e) => {
    if (!resizingEvent) return;
    
    const gridElement = document.querySelector('.time-grid');
    if (!gridElement) return;
    
    const rect = gridElement.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const time = Math.max(0, Math.min(24, getTimeFromY(y)));

    setEvents(prev => prev.map(ev => {
      if (ev.id === resizingEvent.event.id) {
        if (resizingEvent.position === 'top') {
          return { ...ev, start: Math.min(time, ev.end - 0.5) };
        } else {
          return { ...ev, end: Math.max(time, ev.start + 0.5) };
        }
      }
      return ev;
    }));
  };

  const EventComponent = ({ event }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, event)}
      className={`absolute right-2 rounded-md text-sm group event-item
        ${event.type === 'work' ? 'bg-green-900/50 border-l-4 border-green-700' : 'bg-blue-900/50 border-l-4 border-blue-700'}`}
      style={{
        left: '0',
        top: `${event.start * 4}rem`,
        height: `${(event.end - event.start) * 4}rem`
      }}
    >
      <div 
        className="absolute inset-x-0 -top-2 h-4 cursor-ns-resize z-10"
        onMouseDown={(e) => {
          e.preventDefault();
          setResizingEvent({ event, position: 'top' });
        }}
      >
        <ChevronUp className="h-4 w-4 mx-auto opacity-50" />
      </div>
      
      <div className="p-2">
        {editingEventId === event.id ? (
          <input
            autoFocus
            className="w-full bg-transparent border border-gray-600 rounded px-1"
            value={event.title}
            onChange={(e) => {
              setEvents(prev => prev.map(ev =>
                ev.id === event.id ? { ...ev, title: e.target.value } : ev
              ));
            }}
            onBlur={() => {
              pushToHistory([...events]);
              setEditingEventId(null);
            }}
          />
        ) : (
          <div className="flex flex-col">
            {(event.end - event.start) <= 0.5 ? (
              <div className="flex justify-between items-baseline">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span 
                    className="truncate"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingEventId(event.id);
                    }}
                  >
                    {event.title}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatTime(event.start)} - {formatTime(event.end)} ({formatDuration(event.end - event.start)})
                  </span>
                </div>
                <button onClick={(e) => {
                  e.stopPropagation();
                  setEvents(prev => prev.filter(e => e.id !== event.id));
                  pushToHistory(events.filter(e => e.id !== event.id));
                }}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <span 
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingEventId(event.id);
                    }}
                  >
                    {event.title}
                  </span>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    setEvents(prev => prev.filter(e => e.id !== event.id));
                    pushToHistory(events.filter(e => e.id !== event.id));
                  }}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {formatTime(event.start)} - {formatTime(event.end)} 
                  <span className="ml-1">({formatDuration(event.end - event.start)})</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div 
        className="absolute inset-x-0 -bottom-2 h-4 cursor-ns-resize z-10"
        onMouseDown={(e) => {
          e.preventDefault();
          setResizingEvent({ event, position: 'bottom' });
        }}
      >
        <ChevronDown className="h-4 w-4 mx-auto opacity-50" />
      </div>
    </div>
  );
  const TimeGrid = ({ columnIndex }) => {
    const handleMouseDown = (e) => {
      if (e.target.closest('.event-item')) return;
      
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const startTime = getTimeFromY(y);
      
      setDragCreating({
        startTime,
        endTime: startTime,
        column: columnIndex
      });
    };

    const handleMouseMove = (e) => {
      if (!dragCreating) return;
      
      if (e.target.closest('.event-item')) return;
      
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const currentTime = Math.max(0, Math.min(24, getTimeFromY(y)));
      
      setDragCreating(prev => ({
        ...prev,
        endTime: currentTime
      }));
    };

    const handleMouseUp = () => {
      if (!dragCreating) return;

      const start = Math.min(dragCreating.startTime, dragCreating.endTime);
      const end = Math.max(dragCreating.startTime, dragCreating.endTime);
      
      if (end - start >= 0.25) {
        const newEvent = {
          id: Date.now().toString(),
          title: "New Event",
          type: "work",
          start,
          end,
          column: columnIndex
        };
        setEvents(prev => [...prev, newEvent]);
        pushToHistory([...events, newEvent]);
      }
      setDragCreating(null);
    };

    return (
      <div 
        className="relative flex-1 min-w-[200px] time-grid border-l border-gray-700 h-full grid-container"
        onDragOver={(e) => handleDrag(e, columnIndex)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Time labels container */}
        <div className="absolute left-0 w-12 h-full select-none">
          <div className="h-16" /> {/* Empty first hour div */}
          {Array.from({ length: 23 }, (_, i) => (
            <div 
              key={i + 1}
              className="h-16 border-t border-gray-700 relative"
            >
              <div className="absolute left-2 -top-3 text-xs text-gray-400">
                {`${(i + 1).toString().padStart(2, '0')}:00`}
              </div>
            </div>
          ))}
        </div>

        {/* Content area for events */}
        <div className="absolute left-12 right-0 h-full">
          <div className="h-16 border-t border-gray-700 relative" />
          {Array.from({ length: 23 }, (_, i) => (
            <div 
              key={i + 1}
              className="h-16 border-t border-gray-700 relative"
              onClick={() => {
                const newEvent = {
                  id: Date.now().toString(),
                  title: "New Event",
                  type: "work",
                  start: i + 1,
                  end: i + 2,
                  column: columnIndex
                };
                setEvents(prev => [...prev, newEvent]);
                pushToHistory([...events, newEvent]);
              }}
            />
          ))}
          
          {events
            .filter(event => event.column === columnIndex)
            .map(event => (
              <EventComponent key={event.id} event={event} />
            ))}

          {dragCreating && dragCreating.column === columnIndex && (
            <div
              className="absolute right-2 bg-blue-900/30 border border-blue-500/50 rounded pointer-events-none"
              style={{
                left: '0',
                top: `${Math.min(dragCreating.startTime, dragCreating.endTime) * 4}rem`,
                height: `${Math.abs(dragCreating.endTime - dragCreating.startTime) * 4}rem`
              }}
            />
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (resizingEvent) {
        e.preventDefault();
        handleResize(e);
      }
    };

    const handleMouseUp = (e) => {
      if (resizingEvent) {
        e.preventDefault();
        pushToHistory([...events]);
        setResizingEvent(null);
      }
    };

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (historyIndex > 0) {
          setHistoryIndex(prev => prev - 1);
          setEvents(history[historyIndex - 1]);
        }
      }
      
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (historyIndex < history.length - 1) {
          setHistoryIndex(prev => prev + 1);
          setEvents(history[historyIndex + 1]);
        }
      }
    };

    if (resizingEvent) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [resizingEvent, events, history, historyIndex]);

  return (
    <div className="h-screen bg-gray-900 text-white p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg h-full flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
          <Button 
              variant="ghost"
              onClick={() => {
                const newDate = new Date(date);
                newDate.setDate(date.getDate() - 1);
                setDate(newDate);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {date.toLocaleDateString('en-US', { 
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </h2>
            <Button 
              variant="ghost"
              onClick={() => {
                const newDate = new Date(date);
                newDate.setDate(date.getDate() + 1);
                setDate(newDate);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setColumns(c => Math.max(c - 1, 1))}
              disabled={columns <= 1}
            >
              Remove View
            </Button>
            <Button
              onClick={() => setColumns(c => Math.min(c + 1, 4))}
              disabled={columns >= 4}
            >
              Add View
            </Button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          <div className="flex h-[1536px]"> {/* 24 hours * 4rem (64px) per hour */}
            {Array.from({ length: columns }, (_, i) => (
              <TimeGrid key={i} columnIndex={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayView;
