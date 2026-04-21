import React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import MathExtension from "tiptap-math"
import "katex/dist/katex.min.css"

interface TiptapMathViewerProps {
  value: string
  className?: string
  isHtml?: boolean
}

export const TiptapMathViewer: React.FC<TiptapMathViewerProps> = ({ value, className, isHtml }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "" }),
      MathExtension.configure({
        katexOptions: { throwOnError: false },
        inlineMath: true,
        blockMath: true,
      }),
    ],
    content: isHtml ? value : undefined,
    editable: false,
    editorProps: {
      attributes: {
        class: className || "",
      },
      parseOptions: { preserveWhitespace: 'full' },
    },
  })

  React.useEffect(() => {
    if (editor) {
      if (isHtml) {
        editor.commands.setContent(value, false)
      } else {
        editor.commands.setContent(value)
      }
    }
  }, [editor, value, isHtml])

  if (!editor) return null

  return (
    <div className={className}>
      <EditorContent editor={editor} />
    </div>
  )
}
