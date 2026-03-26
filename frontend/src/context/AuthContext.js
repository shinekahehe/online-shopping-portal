// src/context/AuthContext.js
// Why Context API over Redux?
// For a mid-size app like this, Context + useReducer covers auth state cleanly
// without Redux boilerplate. Cart state is co-located in CartContext.
// If the app scales to 10+ global slices, migrating to Redux Toolkit is trivial.
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../api/services';

const AuthContext = createContext(null);

const initialState = {
  user:    null,
  token:   localStorage.getItem('token') || null,
  loading: true,   // true while we verify the stored token on mount
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      localStorage.setItem('token', action.payload.token);
      return { ...state, user: action.payload.user, token: action.payload.token, loading: false };
    case 'LOGOUT':
      localStorage.removeItem('token');
      return { user: null, token: null, loading: false };
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount: if a token exists, fetch the current user to validate it
  useEffect(() => {
    if (state.token) {
      authAPI.getMe()
        .then(res => dispatch({ type: 'SET_USER', payload: res.data.user }))
        .catch(()  => dispatch({ type: 'LOGOUT' }));
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login  = (token, user) => dispatch({ type: 'LOGIN',  payload: { token, user } });
  const logout = ()             => dispatch({ type: 'LOGOUT' });

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);