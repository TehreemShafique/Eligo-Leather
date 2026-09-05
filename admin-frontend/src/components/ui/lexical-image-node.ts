import {
  ElementNode,
  type EditorConfig,
  type LexicalNode,
  type SerializedElementNode,
  type DOMConversionMap,
  type DOMExportOutput,
} from "lexical"

type SerializedImageNode = SerializedElementNode & {
  src: string
  altText: string
}

export class ImageNode extends ElementNode {
  __src: string
  __altText: string

  constructor(src: string, altText = "", key?: string) {
    super(key)
    this.__src = src
    this.__altText = altText
  }

  static getType(): string {
    return "image"
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__key)
  }

  static importDOM(): DOMConversionMap {
    return {
      img: (domNode: HTMLElement) => ({
        conversion: (element: HTMLElement) => {
          const img = element as HTMLImageElement
          if (img.parentElement?.tagName === "NOSCRIPT") return null
          return {
            node: $createImageNode(img.getAttribute("src") || "", img.getAttribute("alt") || ""),
          }
        },
      }),
    }
  }

  exportDOM(): DOMExportOutput {
    const img = document.createElement("img")
    img.setAttribute("src", this.__src)
    img.setAttribute("alt", this.__altText)
    img.setAttribute("style", "max-width:100%;height:auto;display:block;margin:8px 0;")
    return { element: img }
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const img = document.createElement("img")
    img.setAttribute("src", this.__src)
    img.setAttribute("alt", this.__altText)
    img.setAttribute("style", "max-width:100%;height:auto;display:block;margin:8px 0;")
    return img
  }

  updateDOM(prevNode: ImageNode, dom: HTMLElement): boolean {
    const img = dom as HTMLImageElement
    if (prevNode.__src !== this.__src) img.setAttribute("src", this.__src)
    if (prevNode.__altText !== this.__altText) img.setAttribute("alt", this.__altText)
    return false
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode(serializedNode.src, serializedNode.altText)
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      type: "image",
      src: this.__src,
      altText: this.__altText,
    }
  }

  isInline(): boolean {
    return false
  }

  canBeEmpty(): boolean {
    return true
  }
}

export function $createImageNode(src: string, altText?: string): ImageNode {
  return new ImageNode(src, altText || "")
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode
}
