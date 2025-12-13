import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Palette, Check } from 'lucide-react';

const ThemeSwitcher = () => {
  const { currentTheme, themes, changeTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeOptions = [
    { id: 'light', name: 'Light', icon: '☀️' },
    { id: 'dark', name: 'Dark', icon: '🌙' },
    { id: 'blue', name: 'Blue Professional', icon: '💼' },
    { id: 'green', name: 'Green Legal', icon: '⚖️' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200"
        style={{
          backgroundColor: isOpen ? 'var(--color-backgroundSecondary)' : 'transparent',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'var(--color-backgroundSecondary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <Palette size={18} />
        <span className="hidden sm:inline text-sm font-medium">Theme</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div
            className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl z-50 overflow-hidden"
            style={{
              backgroundColor: 'var(--color-cardBg)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              className="px-4 py-3 border-b"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <p className="text-sm font-semibold">Choose Theme</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-textSecondary)' }}>
                Select your preferred color scheme
              </p>
            </div>
            
            <div className="py-2">
              {themeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    changeTheme(option.id);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between transition-all duration-150"
                  style={{
                    backgroundColor: currentTheme === option.id ? 'var(--color-backgroundSecondary)' : 'transparent',
                    color: 'var(--color-text)',
                  }}
                  onMouseEnter={(e) => {
                    if (currentTheme !== option.id) {
                      e.currentTarget.style.backgroundColor = 'var(--color-backgroundSecondary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentTheme !== option.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{option.icon}</span>
                    <span className="text-sm font-medium">{option.name}</span>
                  </div>
                  {currentTheme === option.id && (
                    <Check size={16} style={{ color: 'var(--color-primary)' }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSwitcher;
