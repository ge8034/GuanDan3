'use client';

import { useTheme } from '@/lib/theme/theme-context';
import { themeConfigs, GameTheme, ThemeMode } from '@/lib/theme/theme-types';
import { useState, useRef, useEffect } from 'react';
import { useCustomThemes } from '@/lib/hooks/useCustomThemes';
import ThemeEditor from './theme/ThemeEditor';
import {
  Spade,
  Palette,
  Ghost,
  Leaf,
  Waves,
  Sun,
  Moon,
  Settings2,
  X,
  Plus,
  Download,
  Trash2,
  Upload,
  Check
} from 'lucide-react';

export default function ThemeSwitcher() {
  const { gameTheme, mode, setGameTheme, setMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { customThemes, saveCustomTheme, deleteCustomTheme, exportTheme, importTheme } = useCustomThemes();

  const themeIcons: Record<GameTheme, React.ReactNode> = {
    classic: <Spade style={{ width: '20px', height: '20px' }} />,
    modern: <Palette style={{ width: '20px', height: '20px' }} />,
    retro: <Ghost style={{ width: '20px', height: '20px' }} />,
    nature: <Leaf style={{ width: '20px', height: '20px' }} />,
    ocean: <Waves style={{ width: '20px', height: '20px' }} />,
    sunset: <Sun style={{ width: '20px', height: '20px' }} />,
    poker: <Spade style={{ width: '20px', height: '20px' }} />
  };

  const modeIcons: Record<ThemeMode, React.ReactNode> = {
    light: <Sun style={{ width: '20px', height: '20px' }} />,
    dark: <Moon style={{ width: '20px', height: '20px' }} />,
    auto: <Settings2 style={{ width: '20px', height: '20px' }} />
  };

  const allThemes = { ...themeConfigs, ...Object.fromEntries(customThemes.map(t => [t.id, t])) };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleImportTheme = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const theme = await importTheme(file);
        saveCustomTheme(theme);
      } catch (error) {
        console.error('Failed to import theme:', error);
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
    <div style={{ position: 'relative' }} ref={containerRef}>
      {/* 主题切换按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 50,
          padding: '0.75rem',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '2px solid rgba(0, 0, 0, 0.1)',
          color: '#111827',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        aria-label="打开主题设置"
        aria-expanded={isOpen}
      >
        {themeIcons[gameTheme] || <Palette style={{ width: '24px', height: '24px' }} />}
      </button>

      {/* 背景遮罩 */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 主题设置面板 */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: '5rem',
            right: '1rem',
            zIndex: 50,
            width: '384px',
            maxHeight: '80vh',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '2px solid #e5e7eb',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* 头部 */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '2px solid #e5e7eb',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>主题设置</h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '0.25rem',
                  borderRadius: '8px',
                  color: '#6b7280',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#111827';
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="关闭主题设置"
              >
                <X style={{ width: '24px', height: '24px' }} />
              </button>
            </div>
          </div>

          {/* 内容区域 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
            {/* 显示模式 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#6b7280',
                marginBottom: '0.5rem',
              }}>显示模式</label>
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                backgroundColor: '#f3f4f6',
                padding: '0.25rem',
                borderRadius: '12px',
              }}>
                {(Object.keys(modeIcons) as ThemeMode[]).map((modeOption) => (
                  <button
                    key={modeOption}
                    onClick={() => setMode(modeOption)}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: 'none',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      minHeight: '64px',
                      cursor: 'pointer',
                      backgroundColor: mode === modeOption ? 'white' : 'transparent',
                      color: mode === modeOption ? '#1a472a' : '#6b7280',
                      boxShadow: mode === modeOption ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (mode !== modeOption) {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (mode !== modeOption) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                    aria-label={`切换到${modeOption === 'auto' ? '自动' : modeOption === 'light' ? '浅色' : '深色'}模式`}
                  >
                    {modeIcons[modeOption]}
                    <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      {modeOption === 'auto' ? '自动' : modeOption === 'light' ? '浅色' : '深色'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 游戏主题 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#6b7280',
                }}>游戏主题</label>
                <button
                  onClick={() => setIsEditorOpen(true)}
                  style={{
                    fontSize: '0.875rem',
                    color: '#1a472a',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  创建自定义主题
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
              }}>
                {Object.entries(allThemes).map(([key, config]) => {
                  const isSelected = gameTheme === key
                  const isCustom = customThemes.some(t => t.id === key)
                  return (
                    <button
                      key={key}
                      onClick={() => setGameTheme(key as GameTheme)}
                      style={{
                        position: 'relative',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '2px solid ' + (isSelected ? '#1a472a' : '#e5e7eb'),
                        transition: 'all 0.2s',
                        textAlign: 'left',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        backgroundColor: 'white',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(26, 71, 42, 0.5)'
                          e.currentTarget.style.backgroundColor = 'rgba(26, 71, 42, 0.02)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = isSelected ? '#1a472a' : '#e5e7eb'
                        e.currentTarget.style.backgroundColor = 'white'
                      }}
                    >
                      {/* 背景渐变 */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          opacity: 0.1,
                          background: config.gradients.primary,
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.2'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.1'
                        }}
                      />

                      {/* 内容 */}
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          padding: '0.5rem',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.5)',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        }}>
                          {themeIcons[key as GameTheme] || <Palette style={{ width: '20px', height: '20px' }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: '#111827',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>{config.name}</div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginTop: '0.125rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>{config.description}</div>
                        </div>

                        {/* 自定义主题操作 */}
                        {isCustom && (
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportTheme(key);
                              }}
                              style={{
                                padding: '0.25rem',
                                color: '#6b7280',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#1a472a';
                                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#6b7280';
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="导出主题"
                              aria-label={`导出${config.name}主题`}
                            >
                              <Download style={{ width: '16px', height: '16px' }} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTheme(key);
                              }}
                              style={{
                                padding: '0.25rem',
                                color: '#6b7280',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#ef4444';
                                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#6b7280';
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="删除主题"
                              aria-label={`删除${config.name}主题`}
                            >
                              <Trash2 style={{ width: '16px', height: '16px' }} />
                            </button>
                          </div>
                        )}

                        {/* 选中标记 */}
                        {isSelected && !isCustom && (
                          <div style={{ marginLeft: 'auto', color: '#1a472a' }}>
                            <Check style={{ width: '20px', height: '20px' }} />
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 导入主题 */}
            {customThemes.length > 0 && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#6b7280',
                  marginBottom: '0.5rem',
                }}>导入主题</label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '2px dashed #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(26, 71, 42, 0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                  }}
                >
                  <Upload style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>点击选择主题文件</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportTheme}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      <ThemeEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={saveCustomTheme}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
