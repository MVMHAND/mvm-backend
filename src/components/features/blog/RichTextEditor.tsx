'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { useEffect, useState } from 'react'

const lowlight = createLowlight(common)

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder: _placeholder }: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default code block
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'rounded bg-gray-100 p-4 font-mono text-sm',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-mvm-blue underline',
        },
      }),
      Image,
      TextStyle,
      Color,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[300px] max-w-none p-4',
      },
    },
  })

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) {
    return null
  }

  // MVM Brand colors
  const MVM_BLUE = '#025fc7'
  const MVM_YELLOW = '#ba9309'

  return (
    <div className="tiptap-editor border border-gray-300 rounded-lg overflow-hidden focus-within:border-mvm-blue focus-within:ring-2 focus-within:ring-mvm-blue focus-within:ring-opacity-20">
      {/* Toolbar - Sticky at top */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-mvm-blue text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-mvm-blue text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          H3
        </button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        {/* Text formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${
            editor.isActive('bold')
              ? 'bg-mvm-blue text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1.5 rounded text-sm italic transition-colors ${
            editor.isActive('italic')
              ? 'bg-mvm-blue text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-3 py-1.5 rounded text-sm line-through transition-colors ${
            editor.isActive('strike')
              ? 'bg-mvm-blue text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          S
        </button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        {/* Text Color with Brand Colors */}
        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="px-3 py-1.5 rounded text-sm bg-white text-gray-700 hover:bg-gray-100 flex items-center gap-1"
            title="Text Color"
          >
            <span className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000000' }} />
            Color
          </button>
          {showColorPicker && (
            <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 space-y-2">
              <div className="text-xs font-medium text-gray-700 mb-2">Brand Colors</div>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => { editor.chain().focus().setColor(MVM_BLUE).run(); setShowColorPicker(false); }}
                  className="w-8 h-8 rounded border-2 border-gray-300 hover:border-mvm-blue"
                  style={{ backgroundColor: MVM_BLUE }}
                  title="MVM Blue"
                />
                <button
                  type="button"
                  onClick={() => { editor.chain().focus().setColor(MVM_YELLOW).run(); setShowColorPicker(false); }}
                  className="w-8 h-8 rounded border-2 border-gray-300 hover:border-mvm-blue"
                  style={{ backgroundColor: MVM_YELLOW }}
                  title="MVM Yellow"
                />
              </div>
              <div className="text-xs font-medium text-gray-700 mb-2">Custom Color</div>
              <input
                type="color"
                onChange={(e) => { editor.chain().focus().setColor(e.target.value).run(); }}
                value={editor.getAttributes('textStyle').color || '#000000'}
                className="w-full h-8 rounded cursor-pointer border border-gray-300"
              />
              <button
                type="button"
                onClick={() => { setShowColorPicker(false); }}
                className="w-full px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetColor().run()}
          className="px-3 py-1.5 rounded text-sm bg-white text-gray-700 hover:bg-gray-100"
          title="Clear Color"
        >
          Reset
        </button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-mvm-blue text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-mvm-blue text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          1. List
        </button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        {/* Blockquote & Code */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            editor.isActive('blockquote')
              ? 'bg-mvm-blue text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Quote
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            editor.isActive('codeBlock')
              ? 'bg-mvm-blue text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Code
        </button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        {/* Link */}
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Enter URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            editor.isActive('link')
              ? 'bg-mvm-blue text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Link
        </button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="px-3 py-1.5 rounded text-sm bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="px-3 py-1.5 rounded text-sm bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ↷
        </button>
      </div>

      {/* Editor Content - Scrollable area with fixed max height */}
      <div className="max-h-[500px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
