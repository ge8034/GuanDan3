import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Upload } from './Upload'
import type { UploadFile } from './Upload'

const meta: Meta<typeof Upload> = {
  title: 'Design System/Molecules/Upload',
  component: Upload,
  tags: ['autodocs'],
  argTypes: {
    accept: {
      control: 'text',
      description: '接受的文件类型',
    },
    multiple: {
      control: 'boolean',
      description: '是否多选',
    },
    maxCount: {
      control: 'number',
      description: '最大文件数量',
    },
    maxSize: {
      control: 'number',
      description: '最大文件大小（字节）',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
    showFileList: {
      control: 'boolean',
      description: '是否显示文件列表',
    },
  },
}

export default meta
type Story = StoryObj<typeof Upload>

export const Default: Story = {
  render: () => {
    const [files, setFiles] = useState<UploadFile[]>([])

    return (
      <div className="p-8 max-w-2xl">
        <Upload value={files} onChange={setFiles} />
      </div>
    )
  },
}

export const DragText: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-2xl">
        <Upload
          dragText="上传产品图片"
          hint="支持 JPG、PNG 格式，建议尺寸 800x600"
        />
      </div>
    )
  },
}

export const Multiple: Story = {
  render: () => {
    const [files, setFiles] = useState<UploadFile[]>([])

    return (
      <div className="p-8 max-w-2xl">
        <Upload
          value={files}
          onChange={setFiles}
          multiple
          dragText="上传多张图片"
          hint="最多可上传 10 张图片"
        />
      </div>
    )
  },
}

export const ImageOnly: Story = {
  render: () => {
    const [files, setFiles] = useState<UploadFile[]>([])

    return (
      <div className="p-8 max-w-2xl">
        <Upload
          value={files}
          onChange={setFiles}
          accept="image/png, image/jpeg, image/gif"
          dragText="上传头像"
          hint="支持 PNG、JPG、GIF 格式，建议正方形"
          maxSize={5 * 1024 * 1024} // 5MB
        />
      </div>
    )
  },
}

export const DocumentOnly: Story = {
  render: () => {
    const [files, setFiles] = useState<UploadFile[]>([])

    return (
      <div className="p-8 max-w-2xl">
        <Upload
          value={files}
          onChange={setFiles}
          accept=".pdf,.doc,.docx,.txt"
          dragText="上传文档"
          hint="支持 PDF、Word、TXT 格式"
        />
      </div>
    )
  },
}

export const MaxCount: Story = {
  render: () => {
    const [files, setFiles] = useState<UploadFile[]>([
      {
        id: '1',
        name: 'existing-file.jpg',
        size: 1024 * 500,
        type: 'image/jpeg',
        url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCE',
      },
    ])

    return (
      <div className="p-8 max-w-2xl">
        <Upload
          value={files}
          onChange={setFiles}
          maxCount={3}
          dragText="上传图片（最多3张）"
          hint="还可上传 {2} 张图片"
        />
      </div>
    )
  },
}

export const Disabled: Story = {
  render: () => {
    const [files] = useState<UploadFile[]>([
      {
        id: '1',
        name: 'locked-file.jpg',
        size: 1024 * 500,
        type: 'image/jpeg',
        url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCE',
      },
    ])

    return (
      <div className="p-8 max-w-2xl">
        <Upload
          value={files}
          disabled
          dragText="上传已禁用"
          hint="当前状态无法上传"
        />
      </div>
    )
  },
}

export const AvatarUpload: Story = {
  render: () => {
    const [files, setFiles] = useState<UploadFile[]>([])

    return (
      <div className="p-8 max-w-md">
        <h2 className="text-xl font-semibold mb-6">上传头像</h2>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <Upload
            value={files}
            onChange={setFiles}
            accept="image/*"
            maxSize={2 * 1024 * 1024}
            dragText="点击或拖拽上传头像"
            hint="支持 JPG、PNG 格式，不超过 2MB，建议尺寸 200x200"
          />

          {files.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-neutral-600">
                已选择: {files[0].name} ({Math.round(files[0].size / 1024)} KB)
              </p>
            </div>
          )}
        </div>
      </div>
    )
  },
}

export const ProductImages: Story = {
  render: () => {
    const [files, setFiles] = useState<UploadFile[]>([
      {
        id: '1',
        name: 'main-product.jpg',
        size: 1024 * 800,
        type: 'image/jpeg',
        url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCE',
      },
    ])

    return (
      <div className="p-8 max-w-2xl">
        <h2 className="text-xl font-semibold mb-6">商品图片</h2>

        <Upload
          value={files}
          onChange={setFiles}
          accept="image/*"
          multiple
          maxCount={5}
          dragText="上传商品图片"
          hint="第一张为封面图，最多可上传 5 张图片"
        />

        <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">图片要求：</h4>
          <ul className="text-xs text-neutral-600 space-y-1">
            <li>• 支持 JPG、PNG 格式</li>
            <li>• 单张图片不超过 2MB</li>
            <li>• 建议尺寸 800x800 像素</li>
            <li>• 第一张图片将作为商品封面</li>
          </ul>
        </div>
      </div>
    )
  },
}

export const FileAttachment: Story = {
  render: () => {
    const [files, setFiles] = useState<UploadFile[]>([])

    return (
      <div className="p-8 max-w-2xl">
        <h2 className="text-xl font-semibold mb-6">附件上传</h2>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <Upload
              value={files}
              onChange={setFiles}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              dragText="上传附件"
              hint="支持 PDF、Word、Excel、TXT 格式，单个文件不超过 10MB"
              maxSize={10 * 1024 * 1024}
            />
          </div>

          <div className="p-4 bg-neutral-50 text-sm text-neutral-600">
            <p><strong>提示：</strong></p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>上传前请确保文件内容完整</li>
              <li>支持批量上传，但建议单个上传便于管理</li>
              <li>上传后可在列表中预览和删除</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
}

export const NoFileList: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-2xl">
        <Upload
          showFileList={false}
          dragText="拖拽上传（不显示文件列表）"
        />
      </div>
    )
  },
}

export const AutoUpload: Story = {
  render: () => {
    const [files, setFiles] = useState<UploadFile[]>([])
    const [uploading, setUploading] = useState(false)

    const handleUpload = async (file: UploadFile): Promise<string> => {
      setUploading(true)
      // 模拟上传
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setUploading(false)
      return `https://example.com/uploads/${file.id}`
    }

    return (
      <div className="p-8 max-w-2xl">
        <Upload
          value={files}
          onChange={setFiles}
          autoUpload
          onUpload={handleUpload}
          dragText={uploading ? '上传中...' : '点击上传'}
          hint="选择文件后将自动上传"
        />

        {uploading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-primary-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent" />
            <span>正在上传...</span>
          </div>
        )}
      </div>
    )
  },
}
