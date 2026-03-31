'use client';

import { useTheme } from '@/lib/theme/theme-context';
import { themeConfigs, GameTheme, ThemeMode } from '@/lib/theme/theme-types';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomThemes } from '@/lib/hooks/useCustomThemes';
import ThemeEditor from './theme/ThemeEditor';

import { logger } from '@/lib/utils/logger'
export default function ThemeSwitcher() {
  const { gameTheme, mode, setGameTheme, setMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { customThemes, saveCustomTheme, deleteCustomTheme, exportTheme, importTheme } = useCustomThemes();

  const themeIcons: Record<GameTheme, string> = {
    classic: '🎴',
    modern: '🎨',
    retro: '👾',
    nature: '🌿',
    ocean: '🌊',
    sunset: '🌅'
  };

  const modeIcons: Record<ThemeMode, string> = {
    light: '☀️',
    dark: '🌙',
    auto: '🔄'
  };

  const allThemes = { ...themeConfigs, ...Object.fromEntries(customThemes.map(t => [t.id, t])) };

  const handleImportTheme = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const theme = await importTheme(file);
        saveCustomTheme(theme);
      } catch (error) {
        logger.error('Failed to import theme:', error);
      }
    }
  };

  const handleExportTheme = (themeId: string) => {
    const theme = customThemes.find(t => t.id === themeId);
    if (theme) {
      exportTheme(theme);
    }
  };

  const handleDeleteTheme = (themeId: string) => {
    if (confirm('确定要删除这个自定义主题吗？')) {
      deleteCustomTheme(themeId);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 p-3 rounded-full bg-surface/90 backdrop-blur-sm shadow-lg border-2 border-border text-text-primary"
        title="主题设置"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="打开主题设置"
        aria-expanded={isOpen}
      >
        <span className="text-2xl">{themeIcons[gameTheme] || '🎨'}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="fixed top-20 right-4 z-50 w-96 max-h-[80vh] bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-border">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-text-primary">主题设置</h3>
                  <button onClick={() => setIsOpen(false)} className="text-text-secondary hover:text-text-primary">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-secondary mb-2">显示模式</label>
                  <div className="flex gap-2 bg-background-primary p-1 rounded-xl">
                    {(Object.keys(modeIcons) as ThemeMode[]).map((modeOption) => (
                      <button
                        key={modeOption}
                        onClick={() => setMode(modeOption)}
                        className={`flex-1 py-2 px-3 rounded-lg transition-all duration-200 flex flex-col items-center gap-1 ${
                          mode === modeOption
                            ? 'bg-surface shadow-sm text-primary ring-1 ring-border'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                        }`}
                      >
                        <span className="text-xl">{modeIcons[modeOption]}</span>
                        <span className="text-xs font-medium">{modeOption === 'auto' ? '自动' : modeOption === 'light' ? '浅色' : '深色'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-text-secondary">游戏主题</label>
                    <button
                      onClick={() => setIsEditorOpen(true)}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      创建自定义主题
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(allThemes).map(([key, config]) => (
                      <motion.button
                        key={key}
                        onClick={() => setGameTheme(key as GameTheme)}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left overflow-hidden group ${
                          gameTheme === key
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div 
                          className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                          style={{ background: config.gradients.primary }}
                        />
                        <div className="relative flex items-center gap-3">
                          <div className="text-2xl p-2 rounded-lg bg-surface/50 shadow-sm">
                            {themeIcons[key as GameTheme] || '🎨'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-text-primary truncate">{config.name}</div>
                            <div className="text-xs text-text-secondary mt-0.5 truncate">{config.description}</div>
                          </div>
                          {customThemes.some(t => t.id === key) && (
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExportTheme(key);
                                }}
                                className="p-1 text-text-secondary hover:text-primary transition-colors"
                                title="导出主题"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTheme(key);
                                }}
                                className="p-1 text-text-secondary hover:text-error transition-colors"
                                title="删除主题"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                          {gameTheme === key && !customThemes.some(t => t.id === key) && (
                            <div className="ml-auto text-primary">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {customThemes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">导入主题</label>
                    <label className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
                      <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm text-text-secondary">点击选择主题文件</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportTheme}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ThemeEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={saveCustomTheme}
      />
    </div>
  );
}