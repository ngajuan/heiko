'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, GripVertical, X, ChevronUp, ChevronDown, Clock } from 'lucide-react';

// Define types for our data
interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  start: number;
  end: number;
  column: number;
  description?: string;
}

interface DragCreatingState {
  startTime: number;
  endTime: number;
  column: number;
}

interface ResizingEventState {
  event: CalendarEvent;
  position: 'top' | 'bottom';
}

// Utility functions with type annotations
const formatTime = (time: number): string => {
  const hours = Math.floor(time);
  const minutes = Math.round((time % 1) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const formatDuration = (duration: number): string => {
  const hours = Math.floor(duration);
  const minutes = Math.round((duration % 1) * 60);
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
};

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'ghost' | 'success';
  [key: string]: any;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'default', ...props }) => (
  <button 
    className={`px-4 py-2 rounded ${
      variant === 'ghost' 
        ? 'hover:bg-gray-700' 
        : variant === 'success'
        ? 'bg-green-800 hover:bg-green-700'
        : 'bg-gray-700 hover:bg-gray-600'
    }`}
    {...props}
  >
    {children}
  </button>
);

const DayView: React.FC = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [columns, setColumns] = useState<number>(1);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [history, setHistory] = useState<CalendarEvent[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [resizingEvent, setResizingEvent] = useState<ResizingEventState | null>(null);
  const [dragCreating, setDragCreating] = useState<DragCreatingState | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // Default values for new event
  const defaultStartTime = 3.5; // 03:30
  const defaultEndTime = 6.0; // 06:00
  const defaultColumn = 0;

  // Form state for the side panel
  const [title, setTitle] = useState<string>('New Event');
  const [description, setDescription] = useState<string>('');
  const [startTime, setStartTime] = useState<string>(formatTime(defaultStartTime));
  const [endTime, setEndTime] = useState<string>(formatTime(defaultEndTime));
  
  const dragItem = useRef<CalendarEvent | null>(null);
  const dragNode = useRef<HTMLElement | null>(null);

  const getTimeFromY = (y: number): number => Math.floor(y / 64 * 2) / 2;

  // Initialize side panel with default values or selected event data
  useEffect(() => {
    if (selectedEvent) {
      setTitle(selectedEvent.title || '');
      setDescription(selectedEvent.description || '');
      setStartTime(formatTime(selectedEvent.start));
      setEndTime(formatTime(selectedEvent.end));
    } else {
      setTitle('New Event');
      setDescription('');
      setStartTime(formatTime(defaultStartTime));
      setEndTime(formatTime(defaultEndTime));
    }
  }, [selectedEvent]);

  const pushToHistory = (newEvents: CalendarEvent[]): void => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newEvents);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleDragStart = (e: React.DragEvent, event: CalendarEvent): void => {
    e.stopPropagation();
    dragItem.current = event;
    dragNode.current = e.target as HTMLElement;
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDrag = (e: React.DragEvent, columnIndex: number): void => {
    e.preventDefault();
    if (!dragItem.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const time = getTimeFromY(y);
    
    const duration = dragItem.current.end - dragItem.current.start;
    setEvents(prev => prev.map(ev => 
      ev.id === dragItem.current?.id 
        ? { ...ev, start: time, end: time + duration, column: columnIndex }
        : ev
    ));
  };

  const handleResize = (e: MouseEvent): void => {
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
    
    // Update selected event if it's being resized
    if (selectedEvent && selectedEvent.id === resizingEvent.event.id) {
      const updatedEvent = events.find(ev => ev.id === resizingEvent.event.id);
      if (updatedEvent) {
        setSelectedEvent(updatedEvent);
      }
    }
  };

  interface EventComponentProps {
    event: CalendarEvent;
  }

  const EventComponent: React.FC<EventComponentProps> = ({ event }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, event)}
      onDragEnd={() => {
        dragItem.current = null;
        dragNode.current = null;
      }}
      className={`absolute right-2 rounded-md text-sm group event-item
        ${selectedEvent && selectedEvent.id === event.id ? 'ring-2 ring-blue-400' : ''}
        ${event.type === 'work' ? 'bg-green-900/50 border-l-4 border-green-700' : 'bg-blue-900/50 border-l-4 border-blue-700'}`}
      style={{
        left: '0',
        top: `${event.start * 4}rem`,
        height: `${(event.end - event.start) * 4}rem`
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedEvent(event);
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
                  if (selectedEvent && selectedEvent.id === event.id) {
                    setSelectedEvent(null);
                  }
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
                    if (selectedEvent && selectedEvent.id === event.id) {
                      setSelectedEvent(null);
                    }
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

  interface TimeGridProps {
    columnIndex: number;
  }

  const TimeGrid: React.FC<TimeGridProps> = ({ columnIndex }) => {
    const handleMouseDown = (e: React.MouseEvent): void => {
      if (e.target instanceof Element && e.target.closest('.event-item')) return;
      
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const startTime = getTimeFromY(y);
      
      setDragCreating({
        startTime,
        endTime: startTime,
        column: columnIndex
      });
    };

    const handleMouseMove = (e: React.MouseEvent): void => {
      if (!dragCreating) return;
      
      if (e.target instanceof Element && e.target.closest('.event-item')) return;
      
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const currentTime = Math.max(0, Math.min(24, getTimeFromY(y)));
      
      setDragCreating(prev => prev ? {
        ...prev,
        endTime: currentTime
      } : null);
    };

    const handleMouseUp = (): void => {
      if (!dragCreating) return;

      const start = Math.min(dragCreating.startTime, dragCreating.endTime);
      const end = Math.max(dragCreating.startTime, dragCreating.endTime);
      
      if (end - start >= 0.25) {
        const newEvent: CalendarEvent = {
          id: Date.now().toString(),
          title: "New Event",
          type: "work",
          start,
          end,
          column: columnIndex,
          description: ""
        };
        const updatedEvents = [...events, newEvent];
        setEvents(updatedEvents);
        pushToHistory(updatedEvents);
        setSelectedEvent(newEvent);
      }
      setDragCreating(null);
    };

    return (
      <div 
        className="relative flex-1 min-w-[200px] time-grid border-l border-gray-700 h-full grid-container"
        onDragOver={(e) => handleDrag(e, columnIndex)}
        onDrop={() => {
          dragItem.current = null;
          dragNode.current = null;
        }}
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
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  const newEvent: CalendarEvent = {
                    id: Date.now().toString(),
                    title: "New Event",
                    type: "work",
                    start: i + 1,
                    end: i + 2,
                    column: columnIndex,
                    description: ""
                  };
                  const updatedEvents = [...events, newEvent];
                  setEvents(updatedEvents);
                  pushToHistory(updatedEvents);
                  setSelectedEvent(newEvent);
                }
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
  
  // Side Panel Component - Now always visible
  const SidePanel: React.FC = () => {
    // Use local component state for form inputs
    const [inputTitle, setInputTitle] = useState<string>(selectedEvent?.title || 'New Event');
    const [inputDescription, setInputDescription] = useState<string>(selectedEvent?.description || '');
    const [inputStartTime, setInputStartTime] = useState<string>(selectedEvent ? formatTime(selectedEvent.start) : formatTime(3.5));
    const [inputEndTime, setInputEndTime] = useState<string>(selectedEvent ? formatTime(selectedEvent.end) : formatTime(6.0));

    // Sync form fields when selected event changes
    useEffect(() => {
      if (selectedEvent) {
        setInputTitle(selectedEvent.title || '');
        setInputDescription(selectedEvent.description || '');
        setInputStartTime(formatTime(selectedEvent.start));
        setInputEndTime(formatTime(selectedEvent.end));
      } else {
        setInputTitle('New Event');
        setInputDescription('');
        setInputStartTime(formatTime(3.5));
        setInputEndTime(formatTime(6.0));
      }
    }, [selectedEvent?.id]);

    // This function updates the selected event
    const updateEvent = (field: string, value: any): void => {
      if (!selectedEvent) return;
      
      setEvents(prev => {
        const newEvents = prev.map(ev => 
          ev.id === selectedEvent.id ? { ...ev, [field]: value } : ev
        );
        
        // Find the updated event
        const updatedEvent = newEvents.find(ev => ev.id === selectedEvent.id);
        
        // Update the selected event reference
        if (updatedEvent) {
          setSelectedEvent(updatedEvent);
        }
        
        return newEvents;
      });
    };
    
    // Parse time string to decimal value
    const parseTimeString = (timeStr: string): number | null => {
      const timeMatch = timeStr.match(/^(\d{1,2}):(\d{1,2})$/);
      if (!timeMatch) return null;
      
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
      
      return hours + (minutes / 60);
    };
    
    // Handle time field changes
    const handleTimeUpdate = (field: string, timeString: string): void => {
      const timeValue = parseTimeString(timeString);
      if (timeValue === null) return;
      
      if (selectedEvent) {
        if (field === 'start') {
          if (timeValue >= selectedEvent.end) return;
          updateEvent('start', timeValue);
        } else if (field === 'end') {
          if (timeValue <= selectedEvent.start) return;
          updateEvent('end', timeValue);
        }
      }
    };
    
    // Create a new event or update existing one
    const handleSaveEvent = (): void => {
      if (selectedEvent) {
        // Just save history for existing event
        pushToHistory([...events]);
      } else {
        // Create a new event
        const startValue = parseTimeString(inputStartTime);
        const endValue = parseTimeString(inputEndTime);
        
        if (startValue === null || endValue === null || startValue >= endValue) return;
        
        const newEvent: CalendarEvent = {
          id: Date.now().toString(),
          title: inputTitle || 'New Event',
          type: 'work',
          start: startValue,
          end: endValue,
          column: 0, // Default column
          description: inputDescription || ''
        };
        
        const updatedEvents = [...events, newEvent];
        setEvents(updatedEvents);
        pushToHistory(updatedEvents);
        setSelectedEvent(newEvent);
      }
    };

    // Calculate duration display
    const getDurationDisplay = (): string => {
      if (selectedEvent) {
        return formatDuration(selectedEvent.end - selectedEvent.start);
      } else {
        const startValue = parseTimeString(inputStartTime);
        const endValue = parseTimeString(inputEndTime);
        
        if (startValue === null || endValue === null) return '';
        
        const duration = endValue - startValue;
        return duration > 0 ? formatDuration(duration) : '';
      }
    };

    return (
      <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 flex flex-col h-full">
        <div className="mb-4">
          <input 
            type="text"
            value={inputTitle}
            onChange={(e) => setInputTitle(e.target.value)}
            onBlur={() => selectedEvent && updateEvent('title', inputTitle)}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            placeholder="New Event"
          />
        </div>
        
        <div className="flex items-center mb-4">
          <Clock className="h-5 w-5 mr-2 text-gray-400" />
          <div className="flex items-center gap-1">
            <input 
              type="text"
              value={inputStartTime}
              onChange={(e) => setInputStartTime(e.target.value)}
              onBlur={() => handleTimeUpdate('start', inputStartTime)}
              className="w-16 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-center"
            />
            <span className="text-gray-400">→</span>
            <input 
              type="text"
              value={inputEndTime}
              onChange={(e) => setInputEndTime(e.target.value)}
              onBlur={() => handleTimeUpdate('end', inputEndTime)}
              className="w-16 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-center"
            />
            <span className="text-gray-400 text-xs ml-1">
              ({getDurationDisplay()})
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm">
            {date.toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short', 
              day: 'numeric'
            })}
          </div>
        </div>
        
        <div className="flex-grow mb-4">
          <textarea 
            value={inputDescription}
            onChange={(e) => setInputDescription(e.target.value)}
            onBlur={() => selectedEvent && updateEvent('description', inputDescription)}
            className="w-full h-40 resize-none bg-gray-900 border border-gray-700 rounded px-3 py-2"
            placeholder="Description"
          />
        </div>
        
        <Button 
          variant="success"
          onClick={handleSaveEvent}
          className="w-full"
        >
          Push to calendar
        </Button>
      </div>
    );
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent): void => {
      if (resizingEvent) {
        e.preventDefault();
        handleResize(e);
      }
    };

    const handleMouseUp = (e: MouseEvent): void => {
      if (resizingEvent) {
        e.preventDefault();
        pushToHistory([...events]);
        setResizingEvent(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
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

  // Update selectedEvent when events change
  useEffect(() => {
    if (selectedEvent) {
      const updatedEvent = events.find(event => event.id === selectedEvent.id);
      if (updatedEvent) {
        setSelectedEvent(updatedEvent);
      } else {
        setSelectedEvent(null);
      }
    }
  }, [events]);

  return (
    <div className="h-screen bg-gray-900 text-white p-4 flex">
      <div className="bg-gray-800 border border-gray-700 rounded-lg h-full flex flex-col flex-1">
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
      
      {/* Side panel - now always visible regardless of selected event */}
      <div className="side-panel ml-4">
        <SidePanel />
      </div>
    </div>
  );
};

export default DayView;