"use client"

import React, { useRef, useEffect } from "react"
import {
  TextB,
  TextItalic,
  TextUnderline,
  ListBullets,
  ListNumbers,
  LinkSimple,
  Image as ImageIcon,
  Code,
  Sparkle,
  ArrowCounterClockwise,
} from "@phosphor-icons/react"
import { toast } from "sonner"

interface RichTextEditorProps {
  value: string
  onChange: (htmlContent: string) => void
  placeholder?: string
  minHeight?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write content here...",
  minHeight = "240px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)

  // Sync initial content to contentEditable div without losing cursor
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      // If value is plain text without HTML tags, wrap in paragraphs
      if (value && !value.includes("<") && !value.includes(">")) {
        const formattedParagraphs = value
          .split("\n\n")
          .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
          .join("")
        editorRef.current.innerHTML = formattedParagraphs
      } else {
        editorRef.current.innerHTML = value || ""
      }
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  // Execute MS-Word style formatting command
  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return
    editorRef.current.focus()
    document.execCommand(command, false, value)
    handleInput()
  }

  const handleInsertLink = () => {
    const url = prompt("Enter link URL:", "https://")
    if (url) {
      execCmd("createLink", url)
    }
  }

  const handleInsertImage = () => {
    const url = prompt("Enter image URL:", "https://")
    if (url) {
      execCmd("insertImage", url)
    }
  }

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-2xs font-sans">
      {/* MS-Word Style Formatting Toolbar */}
      <div className="p-2 border-b border-gray-200 bg-gray-50/90 flex flex-wrap items-center gap-1 text-gray-800 select-none">
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <Sparkle className="w-4 h-4 text-indigo-600 shrink-0" />
        </div>

        {/* Heading Dropdown */}
        <select
          onChange={(e) => {
            const val = e.target.value
            if (val === "p") execCmd("formatBlock", "p")
            else if (val === "h1") execCmd("formatBlock", "h1")
            else if (val === "h2") execCmd("formatBlock", "h2")
            else if (val === "h3") execCmd("formatBlock", "h3")
          }}
          defaultValue="p"
          className="h-7 px-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-800 focus:outline-hidden cursor-pointer hover:bg-gray-100"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <div className="h-4 w-px bg-gray-300 mx-1" />

        {/* Bold */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            execCmd("bold")
          }}
          className="p-1.5 hover:bg-gray-200 active:bg-gray-300 rounded font-bold text-gray-900 transition-colors cursor-pointer"
          title="Bold (MS Word B)"
        >
          <TextB className="w-4 h-4" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            execCmd("italic")
          }}
          className="p-1.5 hover:bg-gray-200 active:bg-gray-300 rounded text-gray-900 transition-colors cursor-pointer"
          title="Italic (MS Word I)"
        >
          <TextItalic className="w-4 h-4" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            execCmd("underline")
          }}
          className="p-1.5 hover:bg-gray-200 active:bg-gray-300 rounded text-gray-900 transition-colors cursor-pointer"
          title="Underline (MS Word U)"
        >
          <TextUnderline className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-gray-300 mx-1" />

        {/* Bullet List */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            execCmd("insertUnorderedList")
          }}
          className="p-1.5 hover:bg-gray-200 active:bg-gray-300 rounded text-gray-900 transition-colors cursor-pointer"
          title="Bullet List"
        >
          <ListBullets className="w-4 h-4" />
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            execCmd("insertOrderedList")
          }}
          className="p-1.5 hover:bg-gray-200 active:bg-gray-300 rounded text-gray-900 transition-colors cursor-pointer"
          title="Numbered List"
        >
          <ListNumbers className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-gray-300 mx-1" />

        {/* Insert Link */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            handleInsertLink()
          }}
          className="p-1.5 hover:bg-gray-200 active:bg-gray-300 rounded text-gray-900 transition-colors cursor-pointer"
          title="Insert Link"
        >
          <LinkSimple className="w-4 h-4" />
        </button>

        {/* Insert Image */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            handleInsertImage()
          }}
          className="p-1.5 hover:bg-gray-200 active:bg-gray-300 rounded text-gray-900 transition-colors cursor-pointer"
          title="Insert Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        {/* Code Block */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            execCmd("formatBlock", "pre")
          }}
          className="p-1.5 hover:bg-gray-200 active:bg-gray-300 rounded text-gray-900 transition-colors cursor-pointer"
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>

        {/* Clear Formatting */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            execCmd("removeFormat")
          }}
          className="p-1.5 hover:bg-gray-200 active:bg-gray-300 rounded text-gray-500 hover:text-red-600 transition-colors cursor-pointer ml-auto"
          title="Clear Formatting"
        >
          <ArrowCounterClockwise className="w-4 h-4" />
        </button>
      </div>

      {/* WYSIWYG Content Editable Area (MS Word Behavior) */}
      <div
        ref={editorRef}
        contentEditable={true}
        suppressContentEditableWarning={true}
        onInput={handleInput}
        style={{ minHeight }}
        className="p-4 outline-hidden text-xs text-gray-900 leading-relaxed font-sans prose prose-sm max-w-none focus:ring-0 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:my-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:my-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-blue-600 [&_a]:underline [&_pre]:bg-gray-100 [&_pre]:p-2 [&_pre]:rounded [&_pre]:font-mono text-left"
      />
    </div>
  )
}
