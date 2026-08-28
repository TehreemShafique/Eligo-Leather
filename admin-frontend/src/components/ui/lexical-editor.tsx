"use client"

import React, { useRef, useEffect, useCallback } from "react"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import {
  HeadingNode,
  QuoteNode,
  $createHeadingNode,
  $isHeadingNode,
} from "@lexical/rich-text"
import {
  ListItemNode,
  ListNode,
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list"
import { LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link"
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $getSelection,
  $isRangeSelection,
  $isRootNode,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $createParagraphNode,
  $getRoot,
} from "lexical"
import type { ElementNode } from "lexical"
import { $findMatchingParent } from "@lexical/utils"
import { ImageNode, $createImageNode } from "./lexical-image-node"
import {
  TextB,
  TextItalic,
  TextUnderline,
  ListBullets,
  ListNumbers,
  Link as LinkIcon,
  Code,
  Image as ImageIcon,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
} from "@phosphor-icons/react"

interface LexicalEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

const HEADING_LEVELS = ["p", "h1", "h2", "h3", "h4", "h5", "h6"] as const
type HeadingLevel = (typeof HEADING_LEVELS)[number]

function ToolbarButton({
  active,
  onClick,
  onMouseDown,
  title,
  children,
  disabled,
}: {
  active: boolean
  onClick?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  title: string
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        if (onMouseDown) {
          e.preventDefault()
          onMouseDown(e)
        }
      }}
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded cursor-pointer transition-colors ${
        active
          ? "bg-amber-800 text-white shadow-sm"
          : "text-gray-900 hover:bg-gray-200"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
      title={title}
    >
      {children}
    </button>
  )
}

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()
  const [isBold, setIsBold] = React.useState(false)
  const [isItalic, setIsItalic] = React.useState(false)
  const [isUnderline, setIsUnderline] = React.useState(false)
  const [isCode, setIsCode] = React.useState(false)
  const [blockType, setBlockType] = React.useState<HeadingLevel>("p")
  const [isBulletList, setIsBulletList] = React.useState(false)
  const [isNumberedList, setIsNumberedList] = React.useState(false)
  const [isLeft, setIsLeft] = React.useState(false)
  const [isCenter, setIsCenter] = React.useState(false)
  const [isRight, setIsRight] = React.useState(false)
  const [isJustify, setIsJustify] = React.useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      // Text format detection
      setIsBold(selection.hasFormat("bold"))
      setIsItalic(selection.hasFormat("italic"))
      setIsUnderline(selection.hasFormat("underline"))
      setIsCode(selection.hasFormat("code"))

      // Block detection: nearest list ancestor along the anchor's parent chain
      const anchorNode = selection.anchor.getNode()
      const listNode = $findMatchingParent(anchorNode, (n) => $isListNode(n))
      if (listNode) {
        setIsNumberedList(listNode.getTag() === "ol")
        setIsBulletList(listNode.getTag() === "ul")
      } else {
        setIsNumberedList(false)
        setIsBulletList(false)
      }

      // Block detection: nearest top-level block element (whose parent is the root)
      let blockElement: ElementNode | null = null
      if (anchorNode.getParent() !== null) {
        blockElement = $findMatchingParent(anchorNode, (n) => {
          const parent = n.getParent()
          return parent !== null && $isRootNode(parent) && !$isRootNode(n)
        }) as ElementNode | null
      }

      if (blockElement && $isHeadingNode(blockElement)) {
        const tag = blockElement.getTag()
        setBlockType(HEADING_LEVELS.includes(tag as HeadingLevel) ? (tag as HeadingLevel) : "p")
      } else {
        setBlockType("p")
      }

      // Alignment detection
      const format = blockElement?.getFormatType?.()
      setIsLeft(format === "left" || format === "start")
      setIsCenter(format === "center")
      setIsRight(format === "right" || format === "end")
      setIsJustify(format === "justify")
    }
  }, [editor])

  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar()
      })
    })
  }, [editor, updateToolbar])

  const formatBold = () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")
  const formatItalic = () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
  const formatUnderline = () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
  const formatCode = () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")
  const formatBulletList = () => {
    if (isBulletList) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
    } else {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
    }
  }
  const formatNumberedList = () => {
    if (isNumberedList) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
    }
  }
  const formatAlign = (type: "left" | "center" | "right" | "justify") =>
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, type)

  const formatHeading = (tag: HeadingLevel) => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        if (tag === "p") {
          const node = $createParagraphNode()
          selection.insertNodes([node])
        } else {
          const node = $createHeadingNode(tag)
          selection.insertNodes([node])
        }
      }
    })
  }

  const insertLink = () => {
    const url = prompt("Enter link URL:", "https://")
    if (url) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, { url })
    }
  }

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const acceptable = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "image/bmp"]
      if (!acceptable.includes(file.type)) {
        alert("Please choose a JPG, PNG or WebP image.")
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const src = reader.result as string
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const imageNode = $createImageNode(src, file.name.replace(/\.[^/.]+$/, ""))
            selection.insertNodes([imageNode, $createParagraphNode()])
          } else {
            const root = $getRoot()
            root.append($createImageNode(src))
          }
        })
      }
      reader.readAsDataURL(file)
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="p-2 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-1.5 text-xs text-gray-700 font-sans select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp"
        onChange={handleImageFile}
        className="hidden"
      />

      {/* Heading selector: Paragraph + H1-H6 */}
      <select
        value={blockType}
        onChange={(e) => formatHeading(e.target.value as HeadingLevel)}
        className="h-7 px-2 bg-white border border-gray-300 rounded-lg text-[11px] font-semibold text-gray-800 focus:outline-hidden cursor-pointer hover:bg-gray-100"
      >
        <option value="p">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="h4">Heading 4</option>
        <option value="h5">Heading 5</option>
        <option value="h6">Heading 6</option>
      </select>

      <div className="w-px h-5 bg-gray-300 mx-0.5" />

      <ToolbarButton
        active={isBold}
        onMouseDown={() => formatBold()}
        title="Bold (Ctrl+B)"
      >
        <TextB className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        active={isItalic}
        onMouseDown={() => formatItalic()}
        title="Italic (Ctrl+I)"
      >
        <TextItalic className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        active={isUnderline}
        onMouseDown={() => formatUnderline()}
        title="Underline (Ctrl+U)"
      >
        <TextUnderline className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        active={isCode}
        onMouseDown={() => formatCode()}
        title="Inline Code"
      >
        <Code className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-300 mx-0.5" />

      <ToolbarButton
        active={isLeft}
        onMouseDown={() => formatAlign("left")}
        title="Align Left"
      >
        <TextAlignLeft className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        active={isCenter}
        onMouseDown={() => formatAlign("center")}
        title="Align Center"
      >
        <TextAlignCenter className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        active={isRight}
        onMouseDown={() => formatAlign("right")}
        title="Align Right"
      >
        <TextAlignRight className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-300 mx-0.5" />

      <ToolbarButton
        active={isBulletList}
        onMouseDown={() => formatBulletList()}
        title="Bulleted List"
      >
        <ListBullets className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        active={isNumberedList}
        onMouseDown={() => formatNumberedList()}
        title="Numbered List"
      >
        <ListNumbers className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-300 mx-0.5" />

      <ToolbarButton
        active={false}
        onMouseDown={() => insertLink()}
        title="Insert Link"
      >
        <LinkIcon className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        active={false}
        onClick={() => fileInputRef.current?.click()}
        title="Insert Image from Computer"
      >
        <ImageIcon className="w-4 h-4" />
      </ToolbarButton>
    </div>
  )
}

function HtmlPlugin({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const [editor] = useLexicalComposerContext()
  const isUpdatingRef = useRef(false)
  const lastHtmlRef = useRef(value)

  useEffect(() => {
    if (value !== lastHtmlRef.current && !isUpdatingRef.current) {
      editor.update(() => {
        const dom = new DOMParser().parseFromString(value || "<p></p>", "text/html")
        try {
          const nodes = $generateNodesFromDOM(editor, dom)
          const root = $getRoot()
          root.clear()
          nodes.forEach((node) => root.append(node))
        } catch (err) {
          console.error("Lexical HTML import error:", err)
        }
      })
      lastHtmlRef.current = value
    }
  }, [value, editor])

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const html = $generateHtmlFromNodes(editor)
        if (html !== lastHtmlRef.current) {
          lastHtmlRef.current = html
          isUpdatingRef.current = true
          onChange(html)
          isUpdatingRef.current = false
        }
      })
    })
  }, [editor, onChange])

  return null
}

export function LexicalEditor({
  value,
  onChange,
  placeholder = "Write content here...",
  minHeight = "240px",
}: LexicalEditorProps) {
  const initialConfig = {
    namespace: "LexicalEditor",
    theme: {
      paragraph: "mb-2",
      heading: {
        h1: "text-2xl font-extrabold text-gray-900 mb-2",
        h2: "text-xl font-bold text-amber-900 mb-2",
        h3: "text-base font-bold text-gray-800 mb-1.5",
        h4: "text-sm font-bold text-gray-900 mb-1",
        h5: "text-sm font-semibold text-gray-900 mb-1",
        h6: "text-xs font-bold text-gray-900 mb-1",
      },
      list: {
        nested: { listitem: "ml-4" },
        ul: "list-disc pl-5 space-y-1",
        ol: "list-decimal pl-5 space-y-1",
      },
      link: "text-amber-800 underline cursor-pointer",
      text: {
        bold: "font-bold",
        italic: "italic",
        underline: "underline",
        code: "font-mono bg-gray-100 px-1 rounded text-sm",
      },
    },
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, ImageNode],
    onError: (error: Error) => {
      console.error("Lexical error:", error)
    },
  }

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-2xs">
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                style={{ minHeight }}
                className="p-4 text-xs text-gray-900 leading-relaxed font-sans focus:outline-none"
              />
            }
            placeholder={
              <div className="p-4 text-xs text-gray-400 absolute top-0 left-0 pointer-events-none select-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={({ children }: { children: React.ReactNode }) => <>{children}</>}
          />
          <HtmlPlugin value={value} onChange={onChange} />
          <HistoryPlugin />
          <LinkPlugin />
          <ListPlugin />
        </div>
      </LexicalComposer>
    </div>
  )
}
