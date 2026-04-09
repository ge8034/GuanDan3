/**
 * Upload 文件上传组件
 *
 * 文件拖拽上传
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef, useState, useCallback } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes } from 'react'
import { UploadCloud, X, FileText, Image as ImageIcon } from 'lucide-react'

// ============================================
// 类型定义
// ============================================
export interface UploadFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
}

export interface UploadProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /**
   * 已上传文件列表
   */
  value?: UploadFile[]

  /**
   * 默认文件列表
   */
  defaultValue?: UploadFile[]

  /**
   * 接受的文件类型
   */
  accept?: string

  /**
   * 是否多选
   */
  multiple?: boolean

  /**
   * 最大文件数量
   */
  maxCount?: number

  /**
   * 最大文件大小（字节）
   */
  maxSize?: number

  /**
   * 是否禁用
   */
  disabled?: boolean

  /**
   * 是否自动上传
   */
  autoUpload?: boolean

  /**
   * 上传地址
   */
  action?: string

  /**
   * 上传请求头
   */
  headers?: Record<string, string>

  /**
   * 额外上传参数
   */
  data?: Record<string, string | Blob>

  /**
   * 文件变化回调
   */
  onChange?: (files: UploadFile[]) => void

  /**
   * 上传回调
   */
  onUpload?: (file: UploadFile) => Promise<string>

  /**
   * 移除回调
   */
  onRemove?: (file: UploadFile) => void

  /**
   * 超出限制回调
   */
  onExceed?: (files: File[]) => void

  /**
   * 是否显示文件列表
   */
  showFileList?: boolean

  /**
   * 拖拽区域文本
   */
  dragText?: string

  /**
   * 拖拽区域提示文本
   */
  hint?: string
}

// ============================================
// 辅助函数
// ============================================
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const isImage = (type: string): boolean => {
  return type.startsWith('image/')
}

// ============================================
// Upload 主组件
// ============================================
export const Upload = forwardRef<HTMLDivElement, UploadProps>(
  (
    {
      value: controlledFiles,
      defaultValue = [],
      accept,
      multiple = false,
      maxCount,
      maxSize,
      disabled = false,
      autoUpload = false,
      action,
      headers,
      data,
      onChange,
      onUpload,
      onRemove,
      onExceed,
      showFileList = true,
      dragText = '点击或拖拽文件到此处上传',
      hint = '支持单个文件上传',
      className,
      ...props
    },
    ref
  ) => {
    const [internalFiles, setInternalFiles] = useState<UploadFile[]>(defaultValue)
    const [isDragging, setIsDragging] = useState(false)
    const [uploading, setUploading] = useState(false)

    // 确定当前文件列表
    const currentFiles = controlledFiles !== undefined ? controlledFiles : internalFiles

    // 处理文件选择
    const handleFiles = useCallback(
      async (fileList: FileList) => {
        const files = Array.from(fileList)

        // 检查数量限制
        if (maxCount && currentFiles.length + files.length > maxCount) {
          onExceed?.(files)
          return
        }

        // 转换为 UploadFile
        const newFiles: UploadFile[] = files.map((file) => ({
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
        }))

        // 检查文件大小
        if (maxSize) {
          const oversizedFiles = newFiles.filter((f) => f.size > maxSize)
          if (oversizedFiles.length > 0) {
            console.warn('文件超出大小限制:', oversizedFiles)
            // 这里可以添加错误提示
            return
          }
        }

        // 合并文件列表
        let updatedFiles: UploadFile[]
        if (multiple) {
          updatedFiles = [...currentFiles, ...newFiles]
        } else {
          updatedFiles = newFiles.length > 0 ? [newFiles[0]] : currentFiles
        }

        // 更新状态
        if (controlledFiles === undefined) {
          setInternalFiles(updatedFiles)
        }
        onChange?.(updatedFiles)

        // 自动上传
        if (autoUpload && onUpload) {
          setUploading(true)
          try {
            for (const file of newFiles) {
              const url = await onUpload(file)
              // 更新文件 URL
              updatedFiles = updatedFiles.map((f) =>
                f.id === file.id ? { ...f, url } : f
              )
            }
            if (controlledFiles === undefined) {
              setInternalFiles(updatedFiles)
            }
            onChange?.(updatedFiles)
          } finally {
            setUploading(false)
          }
        }
      },
      [
        currentFiles,
        maxCount,
        maxSize,
        multiple,
        autoUpload,
        onUpload,
        onExceed,
        onChange,
        controlledFiles,
      ]
    )

    // 处理文件输入变化
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files)
        // 重置 input 以允许再次选择相同文件
        e.target.value = ''
      }
    }

    // 处理拖拽
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) {
        setIsDragging(true)
      }
    }

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (disabled) return

      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFiles(files)
      }
    }

    // 移除文件
    const handleRemove = (file: UploadFile) => {
      const updatedFiles = currentFiles.filter((f) => f.id !== file.id)

      if (controlledFiles === undefined) {
        setInternalFiles(updatedFiles)
      }
      onChange?.(updatedFiles)
      onRemove?.(file)

      // 释放 blob URL
      if (file.url) {
        URL.revokeObjectURL(file.url)
      }
    }

    // 是否可以添加更多文件
    const canAddMore = !maxCount || currentFiles.length < maxCount

    return (
      <div ref={ref} className={cn('space-y-3', className)} {...props}>
        {/* 上传区域 */}
        {canAddMore && (
          <div
            className={cn(
              'relative',
              'border-2',
              'border-dashed',
              'rounded-lg',
              'p-8',
              'text-center',
              'transition-colors',
              'duration-200',
              disabled
                ? 'border-neutral-200 bg-neutral-50 cursor-not-allowed opacity-50'
                : 'border-neutral-300 hover:border-primary-400 hover:bg-primary-50 cursor-pointer',
              isDragging && 'border-primary-500 bg-primary-50'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept={accept}
              multiple={multiple}
              disabled={disabled}
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ zIndex: 1 }}
            />

            <div className="relative z-0">
              <UploadCloud
                className={cn(
                  'mx-auto',
                  'mb-4',
                  'transition-colors',
                  'duration-200',
                  disabled
                    ? 'text-neutral-400'
                    : isDragging
                      ? 'text-primary-500'
                      : 'text-neutral-500'
                )}
                style={{ width: '48px', height: '48px' }}
              />

              <p
                className={cn(
                  'text-sm',
                  'font-medium',
                  disabled ? 'text-neutral-500' : 'text-neutral-700'
                )}
              >
                {dragText}
              </p>

              {hint && (
                <p className="text-xs text-neutral-500 mt-2">{hint}</p>
              )}

              {accept && (
                <p className="text-xs text-neutral-500 mt-1">
                  支持格式: {accept.split(',').join(', ')}
                </p>
              )}

              {maxSize && (
                <p className="text-xs text-neutral-500 mt-1">
                  最大文件: {formatFileSize(maxSize)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 文件列表 */}
        {showFileList && currentFiles.length > 0 && (
          <div className="space-y-2">
            {currentFiles.map((file) => (
              <div
                key={file.id}
                className={cn(
                  'flex',
                  'items-center',
                  'gap-3',
                  'p-3',
                  'bg-white',
                  'border',
                  'rounded-lg',
                  'transition-all',
                  'duration-200',
                  uploading && 'opacity-50'
                )}
              >
                {/* 文件图标 */}
                {file.url && isImage(file.type) ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div
                    className={cn(
                      'w-12',
                      'h-12',
                      'rounded',
                      'flex',
                      'items-center',
                      'justify-center',
                      isImage(file.type)
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-neutral-100 text-neutral-600'
                    )}
                  >
                    {isImage(file.type) ? (
                      <ImageIcon className="w-6 h-6" />
                    ) : (
                      <FileText className="w-6 h-6" />
                    )}
                  </div>
                )}

                {/* 文件信息 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-neutral-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                {/* 移除按钮 */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(file)}
                    className={cn(
                      'p-1',
                      'rounded',
                      'text-neutral-400',
                      'hover:text-error-500',
                      'hover:bg-error-50',
                      'transition-colors',
                      'duration-150'
                    )}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 上传进度 */}
        {uploading && (
          <div className="flex items-center gap-2 text-sm text-primary-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent" />
            <span>上传中...</span>
          </div>
        )}
      </div>
    )
  }
)

Upload.displayName = 'Upload'

export default Upload
