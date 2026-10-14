"use client";

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { YouTubeVideo } from '../types';

export interface SubscribedChannel {
  channelId: string;
  channelTitle: string;
  avatar?: string;
  subscribedAt: string;
}

interface AppState {
  history: YouTubeVideo[];
  likedVideos: YouTubeVideo[];
  subscriptions: SubscribedChannel[];
}

type AppAction = 
  | { type: 'ADD_TO_HISTORY'; payload: YouTubeVideo }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'TOGGLE_LIKE_VIDEO'; payload: YouTubeVideo }
  | { type: 'REMOVE_LIKED_VIDEO'; payload: string }
  | { type: 'TOGGLE_SUBSCRIPTION'; payload: SubscribedChannel }
  | { type: 'UNSUBSCRIBE'; payload: string };

interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const initialState: AppState = {
  history: [],
  likedVideos: [],
  subscriptions: [],
};

export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TO_HISTORY': {
      const filteredHistory = state.history.filter(v => v.id !== action.payload.id);
      return { ...state, history: [action.payload, ...filteredHistory] };
    }
    case 'CLEAR_HISTORY':
      return { ...state, history: [] };
    case 'TOGGLE_LIKE_VIDEO': {
      const exists = state.likedVideos.some(v => v.id === action.payload.id);
      return {
        ...state,
        likedVideos: exists
          ? state.likedVideos.filter(v => v.id !== action.payload.id)
          : [action.payload, ...state.likedVideos],
      };
    }
    case 'REMOVE_LIKED_VIDEO':
      return {
        ...state,
        likedVideos: state.likedVideos.filter(v => v.id !== action.payload),
      };
    case 'TOGGLE_SUBSCRIPTION': {
      const exists = state.subscriptions.some(s => s.channelId === action.payload.channelId);
      return {
        ...state,
        subscriptions: exists
          ? state.subscriptions.filter(s => s.channelId !== action.payload.channelId)
          : [action.payload, ...state.subscriptions],
      };
    }
    case 'UNSUBSCRIBE':
      return {
        ...state,
        subscriptions: state.subscriptions.filter(s => s.channelId !== action.payload),
      };
    default:
      return state;
  }
}

export type { AppState, AppAction, AppContextProps };

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};