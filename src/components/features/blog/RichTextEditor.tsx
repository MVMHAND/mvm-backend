'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { common, createLowlight } from 'lowlight'
import { useEffect, useState, useCallback, useRef } from 'react'

const lowlight = createLowlight(common)

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder: _placeholder,
}: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false)
  const [showTableMenu, setShowTableMenu] = useState(false)
  const headingDropdownRef = useRef<HTMLDivElement>(null)
  const tableMenuRef = useRef<HTMLDivElement>(null)
  const [toolbarState, setToolbarState] = useState({
    bold: false,
    italic: false,
    strike: false,
    heading2: false,
    heading3: false,
    heading4: false,
    heading5: false,
    heading6: false,
    paragraph: false,
    bulletList: false,
    orderedList: false,
    blockquote: false,
    codeBlock: false,
    link: false,
    table: false,
  })

  // Update toolbar state from editor
  const updateToolbarState = useCallback((editor: ReturnType<typeof useEditor>) => {
    if (!editor) return
    setToolbarState({
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      strike: editor.isActive('strike'),
      heading2: editor.isActive('heading', { level: 2 }),
      heading3: editor.isActive('heading', { level: 3 }),
      heading4: editor.isActive('heading', { level: 4 }),
      heading5: editor.isActive('heading', { level: 5 }),
      heading6: editor.isActive('heading', { level: 6 }),
      paragraph: editor.isActive('paragraph'),
      bulletList: editor.isActive('bulletList'),
      orderedList: editor.isActive('orderedList'),
      blockquote: editor.isActive('blockquote'),
      codeBlock: editor.isActive('codeBlock'),
      link: editor.isActive('link'),
      table: editor.isActive('table'),
    })
  }, [])

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
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'tiptap-table',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[300px] max-w-none p-4',
      },
      transformPastedHTML(html) {
        // Clean up Word paste to preserve headings and tables
        let cleanedHtml = html

        // Convert Word heading paragraphs to proper heading tags
        cleanedHtml = cleanedHtml.replace(
          /<p[^>]*class="[^"]*MsoHeading1[^"]*"[^>]*>(.*?)<\/p>/gi,
          '<h1>$1</h1>'
        )
        cleanedHtml = cleanedHtml.replace(
          /<p[^>]*class="[^"]*MsoHeading2[^"]*"[^>]*>(.*?)<\/p>/gi,
          '<h2>$1</h2>'
        )
        cleanedHtml = cleanedHtml.replace(
          /<p[^>]*class="[^"]*MsoHeading3[^"]*"[^>]*>(.*?)<\/p>/gi,
          '<h3>$1</h3>'
        )
        cleanedHtml = cleanedHtml.replace(
          /<p[^>]*class="[^"]*MsoHeading4[^"]*"[^>]*>(.*?)<\/p>/gi,
          '<h4>$1</h4>'
        )
        cleanedHtml = cleanedHtml.replace(
          /<p[^>]*class="[^"]*MsoHeading5[^"]*"[^>]*>(.*?)<\/p>/gi,
          '<h5>$1</h5>'
        )
        cleanedHtml = cleanedHtml.replace(
          /<p[^>]*class="[^"]*MsoHeading6[^"]*"[^>]*>(.*?)<\/p>/gi,
          '<h6>$1</h6>'
        )

        // Clean up Word-specific classes from actual heading tags
        cleanedHtml = cleanedHtml.replace(/<(h[1-6])[^>]*class="[^"]*Mso[^"]*"[^>]*>/gi, '<$1>')

        // Remove Word-specific span wrappers that might interfere
        cleanedHtml = cleanedHtml.replace(
          /<span[^>]*class="[^"]*MsoHeading[^"]*"[^>]*>(.*?)<\/span>/gi,
          '$1'
        )

        // Remove excessive bold tags that Word adds to headings
        cleanedHtml = cleanedHtml.replace(/<(h[1-6])><b>(.*?)<\/b><\/(h[1-6])>/gi, '<$1>$2</$3>')

        // Clean up Word table styling - preserve table structure but remove Word-specific attributes
        cleanedHtml = cleanedHtml.replace(
          /<table[^>]*class="[^"]*MsoTable[^"]*"[^>]*>/gi,
          '<table>'
        )
        cleanedHtml = cleanedHtml.replace(/<td[^>]*class="[^"]*MsoNormal[^"]*"[^>]*>/gi, '<td>')
        cleanedHtml = cleanedHtml.replace(/<th[^>]*class="[^"]*MsoNormal[^"]*"[^>]*>/gi, '<th>')

        return cleanedHtml
      },
    },
  })

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  // Listen to selection and editor updates to sync toolbar state
  useEffect(() => {
    if (!editor) return

    // Update toolbar state on selection change
    const handleSelectionUpdate = () => {
      updateToolbarState(editor)
    }

    // Update toolbar state on editor update (typing, formatting, etc.)
    const handleUpdate = () => {
      updateToolbarState(editor)
    }

    // Register listeners
    editor.on('selectionUpdate', handleSelectionUpdate)
    editor.on('update', handleUpdate)

    // Initial update
    updateToolbarState(editor)

    // Cleanup
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
      editor.off('update', handleUpdate)
    }
  }, [editor, updateToolbarState])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        headingDropdownRef.current &&
        !headingDropdownRef.current.contains(event.target as Node)
      ) {
        setShowHeadingDropdown(false)
      }
      if (tableMenuRef.current && !tableMenuRef.current.contains(event.target as Node)) {
        setShowTableMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!editor) {
    return null
  }

  // MVM Brand colors
  const MVM_BLUE = '#025fc7'
  const MVM_YELLOW = '#ba9309'

  // Get current active heading level or 'Paragraph'
  const getActiveHeadingLabel = () => {
    if (toolbarState.heading2) return 'H2'
    if (toolbarState.heading3) return 'H3'
    if (toolbarState.heading4) return 'H4'
    if (toolbarState.heading5) return 'H5'
    if (toolbarState.heading6) return 'H6'
    return 'Paragraph'
  }

  return (
    <div className="tiptap-editor overflow-hidden rounded-lg border border-gray-300 focus-within:border-mvm-blue focus-within:ring-2 focus-within:ring-mvm-blue focus-within:ring-opacity-20">
      {/* Toolbar - Sticky at top */}
      <div className="sticky top-0 z-10 flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 p-2">
        {/* Heading Dropdown */}
        <div className="relative" ref={headingDropdownRef}>
          <button
            type="button"
            onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
            className={`flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              toolbarState.heading2 ||
              toolbarState.heading3 ||
              toolbarState.heading4 ||
              toolbarState.heading5 ||
              toolbarState.heading6
                ? 'bg-mvm-blue text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {getActiveHeadingLabel()}
            <span className="text-xs">▼</span>
          </button>
          {showHeadingDropdown && (
            <div className="absolute z-20 mt-1 min-w-[140px] rounded-lg border border-gray-300 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setParagraph().run()
                  setShowHeadingDropdown(false)
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  toolbarState.paragraph
                    ? 'bg-blue-50 text-mvm-blue'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Paragraph
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                  setShowHeadingDropdown(false)
                }}
                className={`w-full px-4 py-2 text-left text-lg font-bold transition-colors ${
                  toolbarState.heading2
                    ? 'bg-blue-50 text-mvm-blue'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Heading 2
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                  setShowHeadingDropdown(false)
                }}
                className={`w-full px-4 py-2 text-left text-base font-semibold transition-colors ${
                  toolbarState.heading3
                    ? 'bg-blue-50 text-mvm-blue'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Heading 3
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 4 }).run()
                  setShowHeadingDropdown(false)
                }}
                className={`w-full px-4 py-2 text-left text-base font-medium transition-colors ${
                  toolbarState.heading4
                    ? 'bg-blue-50 text-mvm-blue'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Heading 4
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 5 }).run()
                  setShowHeadingDropdown(false)
                }}
                className={`w-full px-4 py-2 text-left text-sm font-medium transition-colors ${
                  toolbarState.heading5
                    ? 'bg-blue-50 text-mvm-blue'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Heading 5
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 6 }).run()
                  setShowHeadingDropdown(false)
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  toolbarState.heading6
                    ? 'bg-blue-50 text-mvm-blue'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Heading 6
              </button>
            </div>
          )}
        </div>

        <div className="mx-1 h-8 w-px bg-gray-300" />

        {/* Text formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded px-3 py-1.5 text-sm font-bold transition-colors ${
            toolbarState.bold
              ? 'bg-mvm-blue text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded px-3 py-1.5 text-sm italic transition-colors ${
            toolbarState.italic
              ? 'bg-mvm-blue text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`rounded px-3 py-1.5 text-sm line-through transition-colors ${
            toolbarState.strike
              ? 'bg-mvm-blue text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          S
        </button>

        <div className="mx-1 h-8 w-px bg-gray-300" />

        {/* Text Color with Brand Colors */}
        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center gap-1 rounded bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            title="Text Color"
          >
            <span
              className="h-4 w-4 rounded border border-gray-300"
              style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000000' }}
            />
            Color
          </button>
          {showColorPicker && (
            <div className="absolute z-10 mt-1 space-y-2 rounded-lg border border-gray-300 bg-white p-3 shadow-lg">
              <div className="mb-2 text-xs font-medium text-gray-700">Brand Colors</div>
              <div className="mb-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setColor(MVM_BLUE).run()
                    setShowColorPicker(false)
                  }}
                  className="h-8 w-8 rounded border-2 border-gray-300 hover:border-mvm-blue"
                  style={{ backgroundColor: MVM_BLUE }}
                  title="MVM Blue"
                />
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setColor(MVM_YELLOW).run()
                    setShowColorPicker(false)
                  }}
                  className="h-8 w-8 rounded border-2 border-gray-300 hover:border-mvm-blue"
                  style={{ backgroundColor: MVM_YELLOW }}
                  title="MVM Yellow"
                />
              </div>
              <div className="mb-2 text-xs font-medium text-gray-700">Custom Color</div>
              <input
                type="color"
                onChange={(e) => {
                  editor.chain().focus().setColor(e.target.value).run()
                }}
                value={editor.getAttributes('textStyle').color || '#000000'}
                className="h-8 w-full cursor-pointer rounded border border-gray-300"
              />
              <button
                type="button"
                onClick={() => {
                  setShowColorPicker(false)
                }}
                className="w-full rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetColor().run()}
          className="rounded bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          title="Clear Color"
        >
          Reset
        </button>

        <div className="mx-1 h-8 w-px bg-gray-300" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded px-3 py-1.5 text-sm transition-colors ${
            toolbarState.bulletList
              ? 'bg-mvm-blue text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded px-3 py-1.5 text-sm transition-colors ${
            toolbarState.orderedList
              ? 'bg-mvm-blue text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          1. List
        </button>

        <div className="mx-1 h-8 w-px bg-gray-300" />

        {/* Blockquote & Code */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`rounded px-3 py-1.5 text-sm transition-colors ${
            toolbarState.blockquote
              ? 'bg-mvm-blue text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Quote
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`rounded px-3 py-1.5 text-sm transition-colors ${
            toolbarState.codeBlock
              ? 'bg-mvm-blue text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Code
        </button>

        <div className="mx-1 h-8 w-px bg-gray-300" />

        {/* Link */}
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Enter URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={`rounded px-3 py-1.5 text-sm transition-colors ${
            toolbarState.link
              ? 'bg-mvm-blue text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Link
        </button>

        <div className="mx-1 h-8 w-px bg-gray-300" />

        {/* Table Menu */}
        <div className="relative" ref={tableMenuRef}>
          <button
            type="button"
            onClick={() => setShowTableMenu(!showTableMenu)}
            className={`rounded px-3 py-1.5 text-sm transition-colors ${
              toolbarState.table
                ? 'bg-mvm-blue text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            title="Table"
          >
            Table
          </button>
          {showTableMenu && (
            <div className="absolute z-20 mt-1 min-w-[180px] rounded-lg border border-gray-300 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run()
                  setShowTableMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Insert Table
              </button>
              <div className="my-1 border-t border-gray-200" />
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().addRowBefore().run()
                  setShowTableMenu(false)
                }}
                disabled={!editor.can().addRowBefore()}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white"
              >
                Add Row Before
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().addRowAfter().run()
                  setShowTableMenu(false)
                }}
                disabled={!editor.can().addRowAfter()}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white"
              >
                Add Row After
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().deleteRow().run()
                  setShowTableMenu(false)
                }}
                disabled={!editor.can().deleteRow()}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white"
              >
                Delete Row
              </button>
              <div className="my-1 border-t border-gray-200" />
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().addColumnBefore().run()
                  setShowTableMenu(false)
                }}
                disabled={!editor.can().addColumnBefore()}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white"
              >
                Add Column Before
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().addColumnAfter().run()
                  setShowTableMenu(false)
                }}
                disabled={!editor.can().addColumnAfter()}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white"
              >
                Add Column After
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().deleteColumn().run()
                  setShowTableMenu(false)
                }}
                disabled={!editor.can().deleteColumn()}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white"
              >
                Delete Column
              </button>
              <div className="my-1 border-t border-gray-200" />
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().mergeCells().run()
                  setShowTableMenu(false)
                }}
                disabled={!editor.can().mergeCells()}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white"
              >
                Merge Cells
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().splitCell().run()
                  setShowTableMenu(false)
                }}
                disabled={!editor.can().splitCell()}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white"
              >
                Split Cell
              </button>
              <div className="my-1 border-t border-gray-200" />
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().deleteTable().run()
                  setShowTableMenu(false)
                }}
                disabled={!editor.can().deleteTable()}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white"
              >
                Delete Table
              </button>
            </div>
          )}
        </div>

        <div className="mx-1 h-8 w-px bg-gray-300" />

        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="rounded bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="rounded bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
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
